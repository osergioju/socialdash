/**
 * Campaign service — organiza ações de marketing em campanhas, agregando
 * conteúdos do Instagram (Meta), publicações do LinkedIn e páginas do site
 * (GA4) em um dashboard consolidado por período.
 *
 * Arquitetura de canais extensível: o campo `channel` é String
 * (INSTAGRAM | LINKEDIN | WEBSITE hoje; EMAIL, TIKTOK etc. no futuro) —
 * novos canais entram sem alteração estrutural.
 */

const prisma = require("../config/prisma");
const { assertClientAccess } = require("../utils/teamAccess");
const { generateCampaignInsights } = require("./gemini.service");
const {
  httpGet, httpPost, getValidToken,
  fetchLinkedinPosts, fetchLinkedinPostStats,
  IG_API_VERSION,
} = require("./sync.service");

// Canais suportados hoje. Adicionar novos aqui (e um provider de assets) basta.
const SUPPORTED_CHANNELS = ["INSTAGRAM", "LINKEDIN", "WEBSITE"];

// ─── In-memory TTL cache (5 min) — mesmo padrão do metrics.service ───────────
const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map();
function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}
function cacheSet(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}
function invalidateCampaignCache(campaignId) {
  for (const key of cache.keys()) {
    if (key.includes(`:${campaignId}`)) cache.delete(key);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notFound(msg = "Campanha não encontrada") {
  return Object.assign(new Error(msg), { status: 404 });
}

async function getCampaignScoped(id, user) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { channels: true, client: { select: { id: true, name: true } } },
  });
  if (!campaign) throw notFound();
  await assertClientAccess(user, campaign.clientId);
  return campaign;
}

async function getConnection(clientId, platform) {
  return prisma.platformConnection.findUnique({
    where: { clientId_platform: { clientId, platform } },
  });
}

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function toDateOnly(d) {
  return new Date(d).toISOString().slice(0, 10);
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

async function listCampaigns(clientId, user) {
  await assertClientAccess(user, clientId);
  return prisma.campaign.findMany({
    where: { clientId },
    orderBy: { startDate: "desc" },
    include: {
      channels: { select: { channel: true } },
      _count: { select: { posts: true, pages: true } },
    },
  });
}

async function getCampaign(id, user) {
  const campaign = await getCampaignScoped(id, user);
  const [posts, pages] = await Promise.all([
    prisma.campaignPost.findMany({ where: { campaignId: id }, orderBy: { publishedAt: "desc" } }),
    prisma.campaignPage.findMany({ where: { campaignId: id }, orderBy: { pagePath: "asc" } }),
  ]);
  return { ...campaign, posts, pages };
}

async function createCampaign(clientId, data, user) {
  await assertClientAccess(user, clientId);
  const channels = (data.channels || []).filter((c) => SUPPORTED_CHANNELS.includes(c));
  return prisma.campaign.create({
    data: {
      clientId,
      name:        data.name,
      description: data.description || null,
      startDate:   new Date(data.startDate),
      endDate:     new Date(data.endDate),
      status:      data.status || "PLANNING",
      color:       data.color || null,
      imageUrl:    data.imageUrl || null,
      objective:   data.objective || null,
      tags:        data.tags || [],
      responsible: data.responsible || null,
      notes:       data.notes || null,
      channels:    { create: channels.map((channel) => ({ channel })) },
    },
    include: { channels: true },
  });
}

async function updateCampaign(id, data, user) {
  const existing = await getCampaignScoped(id, user);

  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      name:        data.name        ?? existing.name,
      description: data.description !== undefined ? (data.description || null) : existing.description,
      startDate:   data.startDate   ? new Date(data.startDate) : existing.startDate,
      endDate:     data.endDate     ? new Date(data.endDate)   : existing.endDate,
      status:      data.status      ?? existing.status,
      color:       data.color       !== undefined ? (data.color    || null) : existing.color,
      imageUrl:    data.imageUrl    !== undefined ? (data.imageUrl || null) : existing.imageUrl,
      objective:   data.objective   !== undefined ? (data.objective || null) : existing.objective,
      tags:        data.tags        ?? existing.tags,
      responsible: data.responsible !== undefined ? (data.responsible || null) : existing.responsible,
      notes:       data.notes       !== undefined ? (data.notes || null) : existing.notes,
    },
    include: { channels: true },
  });

  if (data.channels) await setChannels(id, data.channels, user);
  invalidateCampaignCache(id);
  return prisma.campaign.findUnique({ where: { id }, include: { channels: true } }) || updated;
}

async function deleteCampaign(id, user) {
  await getCampaignScoped(id, user);
  await prisma.campaign.delete({ where: { id } });
  invalidateCampaignCache(id);
}

// ─── Canais ───────────────────────────────────────────────────────────────────

async function setChannels(id, channels, user) {
  await getCampaignScoped(id, user);
  const valid = [...new Set(channels.filter((c) => SUPPORTED_CHANNELS.includes(c)))];
  await prisma.$transaction([
    prisma.campaignChannel.deleteMany({ where: { campaignId: id, channel: { notIn: valid } } }),
    ...valid.map((channel) =>
      prisma.campaignChannel.upsert({
        where: { campaignId_channel: { campaignId: id, channel } },
        update: {},
        create: { campaignId: id, channel },
      })
    ),
  ]);
  invalidateCampaignCache(id);
  return prisma.campaignChannel.findMany({ where: { campaignId: id } });
}

// ─── Conteúdos disponíveis para associação ────────────────────────────────────

// Instagram: lista mídia direto da Graph API (com thumbnail) e enriquece com
// métricas já sincronizadas na tabela instagram_posts.
async function getAvailableInstagram(id, user, { q } = {}) {
  const campaign = await getCampaignScoped(id, user);
  const cacheKey = `campaign:assets:ig:${campaign.clientId}`;
  let items = cacheGet(cacheKey);

  if (!items) {
    const conn = await getConnection(campaign.clientId, "META");
    if (!conn || conn.status !== "CONNECTED") {
      throw Object.assign(new Error("Integração Meta não conectada para este cliente"), { status: 400 });
    }
    const meta = conn.metadata ? JSON.parse(conn.metadata) : {};
    if (!meta.instagramBusinessAccountId) {
      throw Object.assign(new Error("Conta Instagram não selecionada na conexão Meta"), { status: 400 });
    }

    const token = await getValidToken(conn);
    const igId = meta.instagramBusinessAccountId;

    // Métricas já coletadas pelo sync (reach/saved/shares/plays)
    const dbPosts = await prisma.instagramPost.findMany({ where: { clientId: campaign.clientId } });
    const dbByPostId = Object.fromEntries(dbPosts.map((p) => [p.postId, p]));

    const media = [];
    let url = `https://graph.facebook.com/${IG_API_VERSION}/${igId}/media` +
      `?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=100`;
    while (url && media.length < 300) {
      const res = await httpGet(url, token).catch(() => ({ data: [] }));
      if (res.error) throw Object.assign(new Error(`Meta API: ${res.error.message}`), { status: 502 });
      media.push(...(res.data || []));
      url = res.paging?.next || null;
    }

    items = media.map((m) => {
      const db = dbByPostId[m.id];
      return {
        externalId:   m.id,
        caption:      m.caption || null,
        mediaType:    m.media_type,
        thumbnailUrl: m.thumbnail_url || m.media_url || null,
        permalink:    m.permalink || null,
        publishedAt:  m.timestamp,
        metrics: {
          reach:    db?.reach  ?? 0,
          likes:    m.like_count     ?? db?.likes    ?? 0,
          comments: m.comments_count ?? db?.comments ?? 0,
          shares:   db?.shares ?? 0,
          saved:    db?.saved  ?? 0,
          plays:    db?.plays  ?? 0,
        },
      };
    });
    cacheSet(cacheKey, items);
  }

  if (q) {
    const needle = q.toLowerCase();
    items = items.filter((i) => (i.caption || "").toLowerCase().includes(needle));
  }
  return items;
}

// LinkedIn: lista publicações da organização com estatísticas por post.
async function getAvailableLinkedin(id, user, { q } = {}) {
  const campaign = await getCampaignScoped(id, user);
  const cacheKey = `campaign:assets:li:${campaign.clientId}`;
  let items = cacheGet(cacheKey);

  if (!items) {
    const conn = await getConnection(campaign.clientId, "LINKEDIN");
    if (!conn || conn.status !== "CONNECTED") {
      throw Object.assign(new Error("Integração LinkedIn não conectada para este cliente"), { status: 400 });
    }
    const meta = conn.metadata ? JSON.parse(conn.metadata) : {};
    if (!meta.organizationUrn) {
      throw Object.assign(new Error("Organização LinkedIn não selecionada na conexão"), { status: 400 });
    }

    const token = await getValidToken(conn);
    const rawPosts = await fetchLinkedinPosts(token, meta.organizationUrn, 100);
    const statsMap = await fetchLinkedinPostStats(token, meta.organizationUrn, rawPosts.map((p) => p.id))
      .catch(() => ({}));

    items = rawPosts.map((p) => {
      const s = statsMap[p.id] || {};
      const reactions = s.likeCount || 0, comments = s.commentCount || 0;
      const clicks = s.clickCount || 0, shares = Math.max(0, s.shareCount || 0);
      const impressions = s.impressionCount || 0;
      return {
        externalId:   p.id,
        caption:      p.commentary || null,
        mediaType:    p.content?.media ? "MEDIA" : (p.content?.article ? "ARTICLE" : "TEXT"),
        thumbnailUrl: null,
        permalink:    `https://www.linkedin.com/feed/update/${encodeURIComponent(p.id)}`,
        publishedAt:  new Date(p.publishedAt || p.createdAt || Date.now()).toISOString(),
        metrics: {
          impressions,
          reach:       s.uniqueImpressionsCount || 0,
          reactions,
          comments,
          clicks,
          shares,
          engagement:  reactions + comments + shares + clicks,
        },
      };
    });
    cacheSet(cacheKey, items);
  }

  if (q) {
    const needle = q.toLowerCase();
    items = items.filter((i) => (i.caption || "").toLowerCase().includes(needle));
  }
  return items;
}

// Website: páginas conhecidas do GA4 (tabela ga4_pages, alimentada pelo sync).
async function getAvailablePages(id, user, { q } = {}) {
  const campaign = await getCampaignScoped(id, user);
  const conn = await getConnection(campaign.clientId, "GOOGLE_ANALYTICS");
  if (!conn || conn.status !== "CONNECTED") {
    throw Object.assign(new Error("Integração Google Analytics não conectada para este cliente"), { status: 400 });
  }
  const pages = await prisma.ga4Page.findMany({
    where: {
      clientId: campaign.clientId,
      ...(q ? { pagina: { contains: q, mode: "insensitive" } } : {}),
    },
    include: { metrics: { orderBy: { month: "desc" }, take: 1 } },
    orderBy: { pagina: "asc" },
  });
  return pages.map((p) => ({
    pagePath:   p.pagina,
    label:      p.label,
    lastViews:  p.metrics[0]?.views ?? null,
  }));
}

// ─── Associação de conteúdos e páginas ────────────────────────────────────────

// Substitui os conteúdos associados de um canal (seleção múltipla no front).
// posts: [{ externalId, caption?, mediaType?, thumbnailUrl?, permalink?, publishedAt?, metrics? }]
async function setPosts(id, channel, posts, user) {
  await getCampaignScoped(id, user);
  if (!SUPPORTED_CHANNELS.includes(channel)) {
    throw Object.assign(new Error(`Canal inválido: ${channel}`), { status: 400 });
  }
  await prisma.$transaction([
    prisma.campaignPost.deleteMany({ where: { campaignId: id, channel } }),
    ...(posts.length ? [prisma.campaignPost.createMany({
      data: posts.map((p) => ({
        campaignId:   id,
        channel,
        externalId:   p.externalId,
        caption:      p.caption      || null,
        mediaType:    p.mediaType    || null,
        thumbnailUrl: p.thumbnailUrl || null,
        permalink:    p.permalink    || null,
        publishedAt:  p.publishedAt ? new Date(p.publishedAt) : null,
        metrics:      p.metrics      || {},
      })),
      skipDuplicates: true,
    })] : []),
  ]);
  invalidateCampaignCache(id);
  return prisma.campaignPost.findMany({ where: { campaignId: id, channel } });
}

// pages: [{ pagePath, label? }]
async function setPages(id, pages, user) {
  await getCampaignScoped(id, user);
  await prisma.$transaction([
    prisma.campaignPage.deleteMany({ where: { campaignId: id } }),
    ...(pages.length ? [prisma.campaignPage.createMany({
      data: pages.map((p) => ({
        campaignId: id,
        pagePath:   p.pagePath,
        label:      p.label || null,
      })),
      skipDuplicates: true,
    })] : []),
  ]);
  invalidateCampaignCache(id);
  return prisma.campaignPage.findMany({ where: { campaignId: id } });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

// Atualiza (best-effort) as métricas snapshot dos posts a partir das fontes:
// Instagram usa a tabela instagram_posts (sincronizada); LinkedIn consulta a API.
async function refreshCampaignPostMetrics(campaign) {
  const posts = await prisma.campaignPost.findMany({ where: { campaignId: campaign.id } });

  const igPosts = posts.filter((p) => p.channel === "INSTAGRAM");
  if (igPosts.length) {
    const dbPosts = await prisma.instagramPost.findMany({
      where: { clientId: campaign.clientId, postId: { in: igPosts.map((p) => p.externalId) } },
    });
    const byId = Object.fromEntries(dbPosts.map((p) => [p.postId, p]));
    for (const p of igPosts) {
      const db = byId[p.externalId];
      if (!db) continue;
      const metrics = {
        ...(p.metrics || {}),
        reach: db.reach, likes: db.likes, comments: db.comments,
        shares: db.shares, saved: db.saved, plays: db.plays,
      };
      await prisma.campaignPost.update({ where: { id: p.id }, data: { metrics } });
    }
  }

  const liPosts = posts.filter((p) => p.channel === "LINKEDIN");
  if (liPosts.length) {
    try {
      const conn = await getConnection(campaign.clientId, "LINKEDIN");
      if (conn && conn.status === "CONNECTED") {
        const meta = conn.metadata ? JSON.parse(conn.metadata) : {};
        if (meta.organizationUrn) {
          const token = await getValidToken(conn);
          const statsMap = await fetchLinkedinPostStats(token, meta.organizationUrn, liPosts.map((p) => p.externalId));
          for (const p of liPosts) {
            const s = statsMap[p.externalId];
            if (!s) continue;
            const reactions = s.likeCount || 0, comments = s.commentCount || 0;
            const clicks = s.clickCount || 0, shares = Math.max(0, s.shareCount || 0);
            const metrics = {
              ...(p.metrics || {}),
              impressions: s.impressionCount || 0,
              reach:       s.uniqueImpressionsCount || 0,
              reactions, comments, clicks, shares,
              engagement:  reactions + comments + shares + clicks,
            };
            await prisma.campaignPost.update({ where: { id: p.id }, data: { metrics } });
          }
        }
      }
    } catch (err) {
      console.warn(`[campaign] refresh LinkedIn metrics falhou (campaign=${campaign.id}):`, err.message);
    }
  }
}

// GA4 do período da campanha, filtrado pelas páginas vinculadas.
async function fetchCampaignGa4(campaign, pages) {
  const conn = await getConnection(campaign.clientId, "GOOGLE_ANALYTICS");
  if (!conn || conn.status !== "CONNECTED") return null;
  const meta = conn.metadata ? JSON.parse(conn.metadata) : {};
  if (!meta.propertyId || pages.length === 0) return null;

  const token = await getValidToken(conn);
  const startDate = toDateOnly(campaign.startDate);
  const endDate   = new Date(campaign.endDate) > new Date() ? "today" : toDateOnly(campaign.endDate);

  const pageFilter = {
    filter: {
      fieldName: "pagePath",
      inListFilter: { values: pages.map((p) => p.pagePath).slice(0, 50) },
    },
  };

  const buildBody = (conversionsMetric) => ({
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "sessions" },
      { name: "activeUsers" },
      { name: "newUsers" },
      { name: "screenPageViews" },
      { name: "userEngagementDuration" },
      { name: "eventCount" },
      { name: conversionsMetric },
      { name: "engagementRate" },
    ],
    dimensionFilter: pageFilter,
    orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
  });

  // GA4 renomeou "conversions" para "keyEvents" — tenta o novo e cai para o antigo.
  let report = await httpPost(
    `https://analyticsdata.googleapis.com/v1beta/${meta.propertyId}:runReport`,
    token, buildBody("keyEvents")
  );
  if (report.error) {
    report = await httpPost(
      `https://analyticsdata.googleapis.com/v1beta/${meta.propertyId}:runReport`,
      token, buildBody("conversions")
    );
  }
  if (report.error) {
    console.warn(`[campaign] GA4 report error:`, JSON.stringify(report.error).slice(0, 300));
    return null;
  }

  // Totais por página
  const perPageReport = await httpPost(
    `https://analyticsdata.googleapis.com/v1beta/${meta.propertyId}:runReport`,
    token,
    {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "sessions" }, { name: "activeUsers" }],
      dimensionFilter: pageFilter,
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    }
  ).catch(() => ({ rows: [] }));

  const totals = { sessions: 0, users: 0, newUsers: 0, views: 0, engagementDuration: 0, events: 0, conversions: 0, engagementRateSum: 0 };
  const timeseries = [];
  for (const row of report.rows || []) {
    const date = row.dimensionValues?.[0]?.value || ""; // YYYYMMDD
    const v = row.metricValues || [];
    const get = (i) => parseFloat(v[i]?.value || "0");
    const point = {
      date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
      sessions: Math.round(get(0)),
      users:    Math.round(get(1)),
      views:    Math.round(get(3)),
      events:   Math.round(get(5)),
    };
    timeseries.push(point);
    totals.sessions           += point.sessions;
    totals.users              += Math.round(get(1));
    totals.newUsers           += Math.round(get(2));
    totals.views              += point.views;
    totals.engagementDuration += get(4);
    totals.events             += point.events;
    totals.conversions        += Math.round(get(6));
    totals.engagementRateSum  += get(7);
  }
  const days = (report.rows || []).length || 1;

  return {
    pagesCount: pages.length,
    totals: {
      sessions:          totals.sessions,
      users:             totals.users,
      newUsers:          totals.newUsers,
      views:             totals.views,
      avgEngagementTime: Math.round(totals.engagementDuration / Math.max(totals.users, 1)),
      events:            totals.events,
      conversions:       totals.conversions,
      engagementRate:    +((totals.engagementRateSum / days) * 100).toFixed(1),
    },
    timeseries,
    pages: (perPageReport.rows || []).map((row) => ({
      pagePath: row.dimensionValues?.[0]?.value || "",
      views:    Math.round(parseFloat(row.metricValues?.[0]?.value || "0")),
      sessions: Math.round(parseFloat(row.metricValues?.[1]?.value || "0")),
      users:    Math.round(parseFloat(row.metricValues?.[2]?.value || "0")),
    })),
  };
}

function aggregateChannelPosts(posts, channel) {
  const filtered = posts.filter((p) => p.channel === channel);
  if (filtered.length === 0) return null;

  const totals = {
    reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0, saved: 0,
    reactions: 0, clicks: 0, engagement: 0,
  };
  const byDay = {};

  for (const p of filtered) {
    const m = p.metrics || {};
    totals.reach       += m.reach       || 0;
    totals.impressions += m.impressions || m.plays || 0;
    totals.likes       += m.likes       || 0;
    totals.comments    += m.comments    || 0;
    totals.shares      += m.shares      || 0;
    totals.saved       += m.saved       || 0;
    totals.reactions   += m.reactions   || 0;
    totals.clicks      += m.clicks      || 0;

    const engagement = m.engagement ??
      ((m.likes || 0) + (m.reactions || 0) + (m.comments || 0) + (m.shares || 0) + (m.saved || 0) + (m.clicks || 0));
    totals.engagement += engagement;

    if (p.publishedAt) {
      const day = dayKey(p.publishedAt);
      if (!byDay[day]) byDay[day] = { date: day, reach: 0, impressions: 0, engagement: 0, posts: 0 };
      byDay[day].reach       += m.reach || 0;
      byDay[day].impressions += m.impressions || m.plays || 0;
      byDay[day].engagement  += engagement;
      byDay[day].posts       += 1;
    }
  }

  totals.ctr = totals.impressions > 0 ? +((totals.clicks / totals.impressions) * 100).toFixed(2) : 0;

  return {
    postsCount: filtered.length,
    totals,
    timeseries: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
    posts: filtered
      .map((p) => ({
        id: p.id, externalId: p.externalId, caption: p.caption, mediaType: p.mediaType,
        thumbnailUrl: p.thumbnailUrl, permalink: p.permalink, publishedAt: p.publishedAt,
        metrics: p.metrics,
      }))
      .sort((a, b) => {
        const ea = (a.metrics?.engagement ?? ((a.metrics?.likes || 0) + (a.metrics?.comments || 0)));
        const eb = (b.metrics?.engagement ?? ((b.metrics?.likes || 0) + (b.metrics?.comments || 0)));
        return eb - ea;
      }),
  };
}

// Seguidores ganhos no LinkedIn durante o período da campanha (mês a mês).
async function linkedinFollowersGained(campaign) {
  const start = toDateOnly(campaign.startDate).slice(0, 7);
  const end   = toDateOnly(campaign.endDate).slice(0, 7);
  const rows = await prisma.linkedinMetric.findMany({
    where: { clientId: campaign.clientId, month: { gte: start, lte: end } },
    orderBy: { month: "asc" },
  });
  if (rows.length === 0) return null;
  const fromNovos = rows.reduce((s, r) => s + (r.novosSeguidores || 0), 0);
  if (fromNovos > 0) return fromNovos;
  if (rows.length >= 2) return rows[rows.length - 1].seguidores - rows[0].seguidores;
  return null;
}

async function getDashboard(id, user) {
  const campaign = await getCampaignScoped(id, user);

  const cacheKey = `campaign:dashboard:${id}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  await refreshCampaignPostMetrics(campaign);

  const [posts, pages] = await Promise.all([
    prisma.campaignPost.findMany({ where: { campaignId: id }, orderBy: { publishedAt: "asc" } }),
    prisma.campaignPage.findMany({ where: { campaignId: id } }),
  ]);

  const channelSet = new Set(campaign.channels.map((c) => c.channel));

  const instagram = channelSet.has("INSTAGRAM") ? aggregateChannelPosts(posts, "INSTAGRAM") : null;
  const linkedin  = channelSet.has("LINKEDIN")  ? aggregateChannelPosts(posts, "LINKEDIN")  : null;
  const website   = channelSet.has("WEBSITE")
    ? await fetchCampaignGa4(campaign, pages).catch((e) => {
        console.warn(`[campaign] GA4 dashboard falhou (campaign=${id}):`, e.message);
        return null;
      })
    : null;

  if (linkedin) {
    linkedin.followersGained = await linkedinFollowersGained(campaign).catch(() => null);
  }

  // ── Consolidado entre canais ────────────────────────────────────────────────
  const byChannel = [];
  if (instagram) byChannel.push({
    channel: "INSTAGRAM",
    reach:       instagram.totals.reach,
    impressions: instagram.totals.impressions,
    engagement:  instagram.totals.engagement,
    clicks:      instagram.totals.clicks,
  });
  if (linkedin) byChannel.push({
    channel: "LINKEDIN",
    reach:       linkedin.totals.reach,
    impressions: linkedin.totals.impressions,
    engagement:  linkedin.totals.engagement,
    clicks:      linkedin.totals.clicks,
  });
  if (website) byChannel.push({
    channel: "WEBSITE",
    reach:       website.totals.users,
    impressions: website.totals.views,
    engagement:  website.totals.events,
    clicks:      website.totals.sessions,
  });

  const consolidado = {
    totalReach:       byChannel.reduce((s, c) => s + c.reach, 0),
    totalImpressions: byChannel.reduce((s, c) => s + c.impressions, 0),
    totalEngagement:  byChannel.reduce((s, c) => s + c.engagement, 0),
    totalClicks:      byChannel.reduce((s, c) => s + c.clicks, 0),
    byChannel: byChannel.map((c) => ({
      ...c,
      engagementShare: 0, // calculado abaixo
    })),
  };
  for (const c of consolidado.byChannel) {
    c.engagementShare = consolidado.totalEngagement > 0
      ? +((c.engagement / consolidado.totalEngagement) * 100).toFixed(1)
      : 0;
  }

  // ── Timeline consolidada (por dia, todos os canais) ─────────────────────────
  const timeline = {};
  const addSeries = (series, key) => {
    for (const point of series || []) {
      if (!timeline[point.date]) timeline[point.date] = { date: point.date };
      timeline[point.date][key] = (timeline[point.date][key] || 0) + (point.engagement ?? point.sessions ?? 0);
    }
  };
  addSeries(instagram?.timeseries, "instagram");
  addSeries(linkedin?.timeseries, "linkedin");
  addSeries(website?.timeseries, "website");

  const result = {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status,
      color: campaign.color,
      imageUrl: campaign.imageUrl,
      objective: campaign.objective,
      tags: campaign.tags,
      responsible: campaign.responsible,
      channels: campaign.channels.map((c) => c.channel),
      clientId: campaign.clientId,
      clientName: campaign.client?.name,
    },
    instagram,
    linkedin,
    website,
    consolidado,
    timeline: Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date)),
  };

  cacheSet(cacheKey, result);
  return result;
}

// ─── Insights IA ──────────────────────────────────────────────────────────────

const AI_STALE_HOURS = 12;

async function getAiInsights(id, user, forceRegenerate = false) {
  const campaign = await getCampaignScoped(id, user);

  if (!forceRegenerate) {
    const existing = await prisma.campaignAiReport.findFirst({
      where: { campaignId: id },
      orderBy: { generatedAt: "desc" },
    });
    if (existing) {
      const ageHours = (Date.now() - new Date(existing.generatedAt)) / (1000 * 60 * 60);
      if (ageHours < AI_STALE_HOURS) return { ...existing, cached: true };
    }
  }

  const dashboard = await getDashboard(id, user);
  const report = await generateCampaignInsights({
    campaign: {
      name:       campaign.name,
      clientName: campaign.client?.name ?? "Cliente",
      objective:  campaign.objective,
      startDate:  toDateOnly(campaign.startDate),
      endDate:    toDateOnly(campaign.endDate),
      status:     campaign.status,
      channels:   campaign.channels.map((c) => c.channel),
    },
    dashboard,
  });

  const saved = await prisma.campaignAiReport.create({
    data: { campaignId: id, report, generatedAt: new Date() },
  });
  return { ...saved, cached: false };
}

module.exports = {
  SUPPORTED_CHANNELS,
  listCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign,
  setChannels, setPosts, setPages,
  getAvailableInstagram, getAvailableLinkedin, getAvailablePages,
  getDashboard, getAiInsights,
};
