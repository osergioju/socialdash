/**
 * Sync service — busca métricas das APIs de cada plataforma e salva no banco.
 *
 * Meta (Instagram Business Graph API v22.0)
 * LinkedIn (Organization Analytics API v2)
 * Google Analytics 4 (GA4 Data API v1beta)
 */

const https = require("https");
const prisma = require("../config/prisma");
const { encrypt, decrypt } = require("../utils/crypto");

const IG_API_VERSION = "v22.0";

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function httpGet(url, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: { Authorization: `Bearer ${token}` },
    };
    https.get(opts, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch { resolve({ _raw: raw }); }
      });
    }).on("error", reject);
  });
}



function httpPost(url, token, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        Authorization: `Bearer ${token}`,
      },
    };
    const req = https.request(opts, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch { resolve({ _raw: raw }); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function httpPostForm(url, body) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(body).toString();
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(data),
      },
    };
    const req = https.request(opts, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch { resolve({ _raw: raw }); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

/**
 * Facebook Batch API — executa múltiplos GETs em uma única requisição HTTP.
 * Docs: https://developers.facebook.com/docs/graph-api/batch-requests
 *
 * @param {string} pageToken - Page Access Token (vai no body, não no header)
 * @param {Array<{relative_url: string}>} requests - Até 50 itens por chamada
 */
function httpFacebookBatch(pageToken, requests) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      access_token: pageToken,
      batch: JSON.stringify(requests.map(r => ({ method: "GET", ...r }))),
    }).toString();
    const opts = {
      hostname: "graph.facebook.com",
      path: `/${IG_API_VERSION}/`,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(opts, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch { resolve([]); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ─── Token refresh helpers ────────────────────────────────────────────────────

async function refreshGoogleToken(conn) {
  if (!conn.refreshToken) throw new Error("Sem refresh_token para GA4");
  const refreshToken = decrypt(conn.refreshToken);
  const res = await httpPostForm("https://oauth2.googleapis.com/token", {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
  });
  if (!res.access_token) throw new Error("Falha ao renovar token Google: " + (res.error_description || res.error || "unknown"));
  await prisma.platformConnection.update({
    where: { id: conn.id },
    data: {
      accessToken: encrypt(res.access_token),
      expiresAt: res.expires_in ? new Date(Date.now() + res.expires_in * 1000) : conn.expiresAt,
    },
  });
  return res.access_token;
}

async function getValidToken(conn) {
  const token = decrypt(conn.accessToken);
  if (conn.platform === "GOOGLE_ANALYTICS" && conn.expiresAt) {
    if (new Date(conn.expiresAt) - Date.now() < 5 * 60 * 1000) {
      return await refreshGoogleToken(conn);
    }
  }
  return token;
}

// ─── Date/month helpers ───────────────────────────────────────────────────────

function monthLabel(year, month) {
  const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${labels[month - 1]}/${String(year).slice(2)}`;
}

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

// ─── META / INSTAGRAM ─────────────────────────────────────────────────────────

// Quantos meses de histórico buscar
const IG_MONTHS_BACK = 6;

/**
 * Busca insights por mídia usando a Facebook Batch API.
 * FIX: saved, reach, impressions e shares NÃO estão disponíveis inline no /media.
 * Eles precisam ser buscados via /{media_id}/insights separadamente.
 *
 * Métricas válidas por tipo:
 *   IMAGE/CAROUSEL_ALBUM: reach, impressions, saved, shares, likes, comments
 *   REEL/VIDEO:           reach, plays, likes, comments, shares, saved, total_interactions
 *   STORY:                exits, impressions, reach, replies, taps_forward, taps_back
 */
async function fetchMediaInsightsBatch(pageToken, posts) {
  if (posts.length === 0) return {};

  const BATCH_SIZE = 50;
  const insightsMap = {};

  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);
    const requests = batch.map((p) => {
      let metrics;
      if (p.media_type === "REEL") {
        // REEL v22.0: reach + total_interactions (engloba likes/comments/saves/shares)
        metrics = "reach,plays,total_interactions";
      } else if (p.media_type === "STORY") {
        // STORY v22.0: sem impressions, sem saved
        metrics = "exits,reach,taps_forward,taps_back";
      } else {
        // IMAGE, CAROUSEL_ALBUM, VIDEO feed v22.0: só reach é garantido universal
        metrics = "reach";
      }
      return { relative_url: `${p.id}/insights?metric=${metrics}` };
    });

    console.log(`[sync/meta] batch insights — ${batch.length} posts, primeiro: ${batch[0]?.id} (${batch[0]?.media_type})`);
    const batchResults = await httpFacebookBatch(pageToken, requests).catch((e) => {
      console.error("[sync/meta] batch API error:", e.message);
      return [];
    });
    console.log(`[sync/meta] batch response — ${batchResults.length} itens, códigos:`, batchResults.slice(0, 5).map(r => r?.code));

    for (let j = 0; j < batch.length; j++) {
      const item = batchResults[j];
      if (!item) { console.warn(`[sync/meta] batch item ${j} = null`); continue; }
      if (item.code !== 200) {
        console.warn(`[sync/meta] batch item ${j} (${batch[j].id}) code=${item.code} body=${item.body?.substring?.(0, 200)}`);
        continue;
      }
      try {
        const body = JSON.parse(item.body);
        const ins = {};
        for (const metric of (body.data || [])) {
          const val = metric.values?.[0]?.value ?? metric.value ?? 0;
          ins[metric.name] = typeof val === "number" ? val : 0;
        }
        insightsMap[batch[j].id] = ins;
      } catch (e) {
        console.warn(`[sync/meta] parse error item ${j}:`, e.message);
      }
    }
  }

  console.log(`[sync/meta] insightsMap total: ${Object.keys(insightsMap).length} posts com dados`);
  if (Object.keys(insightsMap).length > 0) {
    const sample = Object.entries(insightsMap)[0];
    console.log(`[sync/meta] amostra insight (${sample[0]}):`, sample[1]);
  }
  return insightsMap;
}

async function syncMeta(clientId, conn) {
  const token = await getValidToken(conn);
  const meta = conn.metadata ? JSON.parse(conn.metadata) : {};

  if (!meta.instagramBusinessAccountId || !meta.pageId) {
    throw new Error("Conta Instagram não selecionada. Acesse Configurações > Conexões > Meta e clique em 'Selecionar Página'.");
  }

  const igId = meta.instagramBusinessAccountId;
  const pageId = meta.pageId;

  // Page Access Token
  const pageTokenRes = await httpGet(
    `https://graph.facebook.com/${IG_API_VERSION}/${pageId}?fields=access_token`,
    token
  );
  if (pageTokenRes.error) {
    console.warn(`[sync/meta] page token error: ${JSON.stringify(pageTokenRes.error)} — usando user token`);
  }
  const pageToken = pageTokenRes.access_token || token;
  console.log(`[sync/meta] igId=${igId} pageId=${pageId} usingPageToken=${!!pageTokenRes.access_token}`);

  // Seguidores atuais (snapshot)
  const profileRes = await httpGet(
    `https://graph.facebook.com/${IG_API_VERSION}/${igId}?fields=followers_count`,
    pageToken
  ).catch(() => ({}));
  const currentFollowers = profileRes.followers_count || 0;

  const now = new Date();
  const since90Unix = Math.floor(new Date(now.getTime() - 90 * 24 * 3600 * 1000).getTime() / 1000);
  const since30Unix = Math.floor(new Date(now.getTime() - 30 * 24 * 3600 * 1000).getTime() / 1000);
  const untilUnix = Math.floor(now.getTime() / 1000);

  // ── Account insights diários — últimos 90 dias (reach, views, profile_views) ──
  const accountInsightsUrl =
    `https://graph.facebook.com/${IG_API_VERSION}/${igId}/insights` +
    `?metric=reach,views,profile_views&period=day&since=${since90Unix}&until=${untilUnix}`;
  console.log(`[sync/meta] account insights URL: ${accountInsightsUrl}`);
  const accountInsightsRes = await httpGet(accountInsightsUrl, pageToken).catch((e) => {
    console.error("[sync/meta] account insights fetch error:", e.message);
    return { data: [] };
  });
  if (accountInsightsRes.error) {
    console.error("[sync/meta] account insights API error:", JSON.stringify(accountInsightsRes.error));
  } else {
    console.log(`[sync/meta] account insights — ${accountInsightsRes.data?.length ?? 0} métricas recebidas`);
    for (const m of (accountInsightsRes.data || [])) {
      const total = (m.values || []).reduce((s, v) => s + (typeof v.value === "number" ? v.value : 0), 0);
      console.log(`  metric=${m.name} total=${total} valores=${m.values?.length ?? 0}`);
    }
  }

  // Agrupa por dia: daily[metrica]["YYYY-MM-DD"] = valor
  const daily = { reach: {}, views: {}, profile_views: {} };
  for (const metric of (accountInsightsRes.data || [])) {
    for (const v of (metric.values || [])) {
      const day = v.end_time?.substring(0, 10);
      if (day && metric.name in daily) {
        daily[metric.name][day] = (daily[metric.name][day] || 0) + (typeof v.value === "number" ? v.value : 0);
      }
    }
  }
  console.log(`[sync/meta] account insights — reach=${Object.values(daily.reach).reduce((a, b) => a + b, 0)} views=${Object.values(daily.views).reduce((a, b) => a + b, 0)} profile_views=${Object.values(daily.profile_views).reduce((a, b) => a + b, 0)}`);

  // ── Follower count diário — máximo 30 dias ────────────────────────────────
  const followerSnapshotRes = await httpGet(
    `https://graph.facebook.com/${IG_API_VERSION}/${igId}/insights` +
    `?metric=follower_count&period=day&since=${since30Unix}&until=${untilUnix}`,
    pageToken
  ).catch(() => ({ data: [] }));

  const followerSnapshots = {};
  for (const v of (followerSnapshotRes.data?.[0]?.values || [])) {
    const day = v.end_time?.substring(0, 10);
    if (day) followerSnapshots[day] = typeof v.value === "number" ? v.value : 0;
  }
  // Delta dia a dia → ganhos por dia
  const dailyFollowerGains = {};
  const snapshotDays = Object.keys(followerSnapshots).sort();
  for (let i = 1; i < snapshotDays.length; i++) {
    const delta = followerSnapshots[snapshotDays[i]] - followerSnapshots[snapshotDays[i - 1]];
    if (delta > 0) dailyFollowerGains[snapshotDays[i]] = delta;
  }

  // ── Media: pagina até cobrir IG_MONTHS_BACK meses ────────────────────────
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - IG_MONTHS_BACK + 1, 1);
  const allPosts = [];
  let mediaUrl = `https://graph.facebook.com/${IG_API_VERSION}/${igId}/media` +
    `?fields=id,media_type,timestamp,like_count,comments_count&limit=100`;

  while (mediaUrl) {
    const res = await httpGet(mediaUrl, pageToken).catch(() => ({ data: [] }));
    const posts = res.data || [];
    if (posts.length === 0) break;
    allPosts.push(...posts);
    // Para quando o post mais antigo da página já passou do cutoff
    const oldest = new Date(posts[posts.length - 1].timestamp);
    if (oldest < cutoffDate) break;
    mediaUrl = res.paging?.next || null;
  }

  const filteredPosts = allPosts.filter(p => new Date(p.timestamp) >= cutoffDate);
  console.log(`[sync/meta] media paginado — total=${allPosts.length} dentro do período=${filteredPosts.length}`);

  // ── Stories ───────────────────────────────────────────────────────────────
  const storiesRes = await httpGet(
    `https://graph.facebook.com/${IG_API_VERSION}/${igId}/stories?fields=id,media_type,timestamp&limit=100`,
    pageToken
  ).catch(() => ({ data: [] }));
  const stories = storiesRes.data || [];

  // ── Insights individuais via Batch API ────────────────────────────────────
  const allMedia = [...filteredPosts, ...stories];
  const insightsMap = await fetchMediaInsightsBatch(pageToken, allMedia).catch(() => ({}));

  // ── Remove registros no formato antigo (last_15d etc) ────────────────────
  await prisma.instagramMetric.deleteMany({
    where: { clientId, month: { in: ["last_15d", "last_30d", "last_60d", "last_90d"] } },
  });

  // ── Agrega por mês calendário e salva ────────────────────────────────────
  const months = [];
  for (let i = 0; i < IG_MONTHS_BACK; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  for (const { year, month } of months) {
    const mk = monthKey(year, month);
    const ml = monthLabel(year, month);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);
    const mkStr = `${year}-${String(month).padStart(2, "0")}`;

    // Soma dados diários de conta deste mês
    const reach = Object.entries(daily.reach).filter(([d]) => d.startsWith(mkStr)).reduce((s, [, v]) => s + v, 0);
    const views = Object.entries(daily.views).filter(([d]) => d.startsWith(mkStr)).reduce((s, [, v]) => s + v, 0);
    const profileViews = Object.entries(daily.profile_views).filter(([d]) => d.startsWith(mkStr)).reduce((s, [, v]) => s + v, 0);
    const novosSeguidores = Object.entries(dailyFollowerGains).filter(([d]) => d.startsWith(mkStr)).reduce((s, [, v]) => s + v, 0);

    // Agrega posts deste mês
    let feedCount = 0, reelsCount = 0, likes = 0, comments = 0;
    let reelsReach = 0, reelsInteractions = 0;

    for (const p of filteredPosts) {
      const ts = new Date(p.timestamp);
      if (ts < monthStart || ts >= monthEnd) continue;
      const ins = insightsMap[p.id] || {};
      const pLikes = p.like_count ?? 0;
      const pComments = p.comments_count ?? 0;
      likes += pLikes;
      comments += pComments;
      if (p.media_type === "REEL") {
        reelsCount++;
        reelsReach += ins.reach ?? 0;
        reelsInteractions += ins.total_interactions ?? (pLikes + pComments);
      } else {
        feedCount++;
      }
    }

    // Stories deste mês
    let storiesCount = 0, storiesViews = 0;
    for (const s of stories) {
      const ts = new Date(s.timestamp);
      if (ts < monthStart || ts >= monthEnd) continue;
      storiesCount++;
      storiesViews += insightsMap[s.id]?.reach ?? 0;
    }

    const igData = {
      monthLabel: ml,
      seguidores: currentFollowers,
      novosSeguidores,
      alcanceOrganico: reach,
      visualizacoes: views,
      interacoes: likes + comments,
      visitasPerfil: profileViews,
      postagensTotal: feedCount + reelsCount,
      reelsQtd: reelsCount,
      reelsAlcance: reelsReach,
      reelsInteracoes: reelsInteractions,
      storiesQtd: storiesCount,
      storiesViews,
      curtidasPosts: likes,
      comentariosPosts: comments,
      salvamentosPosts: 0,
      compartilhamentosPosts: 0,
    };

    const existing = await prisma.instagramMetric.findUnique({ where: { clientId_month: { clientId, month: mk } } });
    if (existing) {
      await prisma.instagramMetric.update({ where: { id: existing.id }, data: igData });
    } else {
      await prisma.instagramMetric.create({ data: { clientId, month: mk, ...igData } });
    }
  }

  // ── Cidades (snapshot do mês atual) ──────────────────────────────────────
  const audienceRes = await httpGet(
    `https://graph.facebook.com/${IG_API_VERSION}/${igId}/insights` +
    `?metric=reached_audience_demographics&period=lifetime&breakdown=city`,
    pageToken
  ).catch(() => ({ data: [] }));

  const cityRawData = audienceRes.data?.[0]?.total_value?.breakdowns?.[0]?.results;
  if (Array.isArray(cityRawData)) {
    const currentMk = monthKey(now.getFullYear(), now.getMonth() + 1);
    for (const entry of cityRawData.slice(0, 10)) {
      const cityName = (entry.dimension_values?.[0] || "Desconhecido").replace(/_/g, " ");
      const count = entry.value || 0;
      let city = await prisma.city.findUnique({ where: { clientId_name_platform: { clientId, name: cityName, platform: "INSTAGRAM" } } });
      if (!city) city = await prisma.city.create({ data: { clientId, name: cityName, platform: "INSTAGRAM" } });
      const existingCm = await prisma.cityMetric.findUnique({ where: { cityId_month: { cityId: city.id, month: currentMk } } });
      if (existingCm) await prisma.cityMetric.update({ where: { id: existingCm.id }, data: { seguidores: count } });
      else await prisma.cityMetric.create({ data: { cityId: city.id, month: currentMk, seguidores: count } });
    }
  }

  return { ok: true, months: months.length, posts: filteredPosts.length };
}

// ─── LINKEDIN ─────────────────────────────────────────────────────────────────

async function discoverLinkedinOrg(token) {
  const res = await httpGet(
    "https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=10",
    token
  );
  const elements = res.elements || [];
  if (elements.length === 0) throw new Error("Nenhuma organização LinkedIn encontrada para este usuário.");
  const orgUrn = elements[0].organizationalTarget;
  const orgId = orgUrn.split(":").pop();
  const orgRes = await httpGet(`https://api.linkedin.com/v2/organizations/${orgId}?fields=localizedName`, token).catch(() => ({}));
  return { organizationUrn: orgUrn, organizationId: orgId, organizationName: orgRes.localizedName || orgId };
}

async function syncLinkedin(clientId, conn) {
  const token = await getValidToken(conn);
  let meta = conn.metadata ? JSON.parse(conn.metadata) : {};

  if (!meta.organizationUrn) {
    const discovered = await discoverLinkedinOrg(token);
    meta = { ...meta, ...discovered };
    await prisma.platformConnection.update({
      where: { id: conn.id },
      data: { metadata: JSON.stringify(meta) },
    });
  }

  const orgUrn = encodeURIComponent(meta.organizationUrn);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const mk = monthKey(year, month);
  const ml = monthLabel(year, month);

  const followerRes = await httpGet(
    `https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${orgUrn}`,
    token
  ).catch(() => ({}));
  const followerStats = followerRes.elements?.[0] || {};
  const seguidores = followerStats.totalFollowerCount || 0;
  const novosSeguidores = followerStats.followerGains?.organicFollowerGain || 0;

  const startMs = new Date(year, month - 1, 1).getTime();
  const endMs = new Date(year, month, 1).getTime() - 1;
  const pageStatsRes = await httpGet(
    `https://api.linkedin.com/v2/organizationPageStatistics?q=organizationalEntity&organizationalEntity=${orgUrn}&timeIntervals.timeGranularityType=MONTH&timeIntervals.timeRange.start=${startMs}&timeIntervals.timeRange.end=${endMs}`,
    token
  ).catch(() => ({}));
  const pageEl = pageStatsRes.elements?.[0]?.totalPageStatistics || {};
  const impressoes = pageEl.views?.allPageViews?.pageViews || 0;
  const alcance = impressoes;

  const shareStatsRes = await httpGet(
    `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${orgUrn}&timeIntervals.timeGranularityType=MONTH&timeIntervals.timeRange.start=${startMs}&timeIntervals.timeRange.end=${endMs}`,
    token
  ).catch(() => ({}));
  const shareEl = shareStatsRes.elements?.[0]?.totalShareStatistics || {};
  const engajamento = shareEl.totalEngagement || 0;
  const cliques = shareEl.clickCount || 0;
  const reacoes = shareEl.likeCount || 0;
  const postagens = shareEl.shareCount || 0;

  const liData = { monthLabel: ml, seguidores, novosSeguidores, alcance, impressoes, engajamento, cliques, reacoes, postagens };
  const existingLi = await prisma.linkedinMetric.findUnique({ where: { clientId_month: { clientId, month: mk } } });
  if (existingLi) await prisma.linkedinMetric.update({ where: { id: existingLi.id }, data: liData });
  else await prisma.linkedinMetric.create({ data: { clientId, month: mk, ...liData } });

  if (followerStats.followerCountsByGeo) {
    for (const geo of followerStats.followerCountsByGeo.slice(0, 10)) {
      const cityName = geo.geo?.name || geo.geoCountryName || "Desconhecido";
      const count = geo.followerCounts?.organicFollowerCount || 0;
      let city = await prisma.city.findUnique({ where: { clientId_name_platform: { clientId, name: cityName, platform: "LINKEDIN" } } });
      if (!city) city = await prisma.city.create({ data: { clientId, name: cityName, platform: "LINKEDIN" } });
      const existingLiCm = await prisma.cityMetric.findUnique({ where: { cityId_month: { cityId: city.id, month: mk } } });
      if (existingLiCm) await prisma.cityMetric.update({ where: { id: existingLiCm.id }, data: { seguidores: count } });
      else await prisma.cityMetric.create({ data: { cityId: city.id, month: mk, seguidores: count } });
    }
  }

  if (followerStats.followerCountsByIndustry) {
    for (const ind of followerStats.followerCountsByIndustry.slice(0, 10)) {
      const nome = ind.industry?.name || `Indústria ${ind.industry?.id}`;
      const seg = ind.followerCounts?.organicFollowerCount || 0;
      const existingInd = await prisma.linkedinIndustry.findUnique({ where: { clientId_nome: { clientId, nome } } });
      if (existingInd) await prisma.linkedinIndustry.update({ where: { id: existingInd.id }, data: { seguidores: seg } });
      else await prisma.linkedinIndustry.create({ data: { clientId, nome, seguidores: seg } });
    }
  }
  if (followerStats.followerCountsByFunction) {
    for (const fn of followerStats.followerCountsByFunction.slice(0, 10)) {
      const nome = fn.function?.name || `Função ${fn.function?.id}`;
      const seg = fn.followerCounts?.organicFollowerCount || 0;
      const existingRole = await prisma.linkedinRole.findUnique({ where: { clientId_nome: { clientId, nome } } });
      if (existingRole) await prisma.linkedinRole.update({ where: { id: existingRole.id }, data: { seguidores: seg } });
      else await prisma.linkedinRole.create({ data: { clientId, nome, seguidores: seg } });
    }
  }

  return { ok: true, month: mk };
}

// ─── GOOGLE ANALYTICS 4 ───────────────────────────────────────────────────────

async function discoverGa4Property(token) {
  const res = await httpGet(
    "https://analyticsadmin.googleapis.com/v1alpha/accountSummaries",
    token
  );
  const accounts = res.accountSummaries || [];
  if (accounts.length === 0) throw new Error("Nenhuma conta GA4 encontrada.");
  for (const acc of accounts) {
    if (acc.propertySummaries?.length > 0) {
      const prop = acc.propertySummaries[0];
      return { propertyId: prop.property, propertyName: prop.displayName };
    }
  }
  throw new Error("Nenhuma propriedade GA4 encontrada.");
}

async function syncGa4(clientId, conn) {
  const token = await getValidToken(conn);
  let meta = conn.metadata ? JSON.parse(conn.metadata) : {};

  if (!meta.propertyId) {
    const discovered = await discoverGa4Property(token);
    meta = { ...meta, ...discovered };
    await prisma.platformConnection.update({
      where: { id: conn.id },
      data: { metadata: JSON.stringify(meta) },
    });
  }

  const propertyId = meta.propertyId;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const mk = monthKey(year, month);
  const ml = monthLabel(year, month);

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  const mainReport = await httpPost(
    `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
    token,
    {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "activeUsers" },
        { name: "newUsers" },
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "engagedSessions" },
        { name: "engagementRate" },
        { name: "userEngagementDuration" },
        { name: "screenPageViewsPerSession" },
        { name: "eventCount" },
      ],
    }
  );

  const row = mainReport.rows?.[0]?.metricValues || [];
  const get = (i) => parseFloat(row[i]?.value || "0");

  const usuariosAtivos = Math.round(get(0));
  const novosUsuarios = Math.round(get(1));
  const usuariosTotais = Math.round(get(2));
  const sessoes = Math.round(get(3));
  const sessoesEngajadas = Math.round(get(4));
  const taxaEngajamento = parseFloat((get(5) * 100).toFixed(2));
  const tempoMedioEngajamento = Math.round(get(6) / Math.max(usuariosAtivos, 1));
  const viewsPorSessao = parseFloat(get(7).toFixed(2));
  const numEventos = Math.round(get(8));

  const ga4Data = { monthLabel: ml, usuariosAtivos, novosUsuarios, usuariosTotais, sessoes, sessoesEngajadas, taxaEngajamento, tempoMedioEngajamento, viewsPorSessao, numEventos };
  const existingGa4 = await prisma.ga4Metric.findUnique({ where: { clientId_month: { clientId, month: mk } } });
  if (existingGa4) await prisma.ga4Metric.update({ where: { id: existingGa4.id }, data: ga4Data });
  else await prisma.ga4Metric.create({ data: { clientId, month: mk, ...ga4Data } });

  const pagesReport = await httpPost(
    `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
    token,
    {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "userEngagementDuration" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10,
    }
  );

  for (const row of pagesReport.rows || []) {
    const pagina = row.dimensionValues?.[0]?.value || "/";
    const views = Math.round(parseFloat(row.metricValues?.[0]?.value || "0"));
    const tempo = Math.round(parseFloat(row.metricValues?.[1]?.value || "0") / Math.max(views, 1));
    const label = pagina === "/" ? "Home" : pagina.replace(/^\/|\/$/g, "").split("/").pop() || pagina;
    let page = await prisma.ga4Page.findUnique({ where: { clientId_pagina: { clientId, pagina } } });
    if (page) await prisma.ga4Page.update({ where: { id: page.id }, data: { label } });
    else page = await prisma.ga4Page.create({ data: { clientId, pagina, label } });
    const existingPm = await prisma.ga4PageMetric.findUnique({ where: { pageId_month: { pageId: page.id, month: mk } } });
    if (existingPm) await prisma.ga4PageMetric.update({ where: { id: existingPm.id }, data: { views, tempoMedio: tempo } });
    else await prisma.ga4PageMetric.create({ data: { pageId: page.id, month: mk, views, tempoMedio: tempo } });
  }

  const originsReport = await httpPost(
    `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
    token,
    {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionSource" }],
      metrics: [
        { name: "sessions" },
        { name: "engagementRate" },
        { name: "userEngagementDuration" },
        { name: "activeUsers" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }
  );

  for (const row of originsReport.rows || []) {
    const fonte = row.dimensionValues?.[0]?.value || "(direct)";
    const sess = Math.round(parseFloat(row.metricValues?.[0]?.value || "0"));
    const taxaEng = parseFloat((parseFloat(row.metricValues?.[1]?.value || "0") * 100).toFixed(1));
    const users = Math.round(parseFloat(row.metricValues?.[3]?.value || "1"));
    const tempoMedio = Math.round(parseFloat(row.metricValues?.[2]?.value || "0") / Math.max(users, 1));
    let origin = await prisma.ga4Origin.findUnique({ where: { clientId_fonte: { clientId, fonte } } });
    if (!origin) origin = await prisma.ga4Origin.create({ data: { clientId, fonte } });
    const existingOm = await prisma.ga4OriginMetric.findUnique({ where: { originId_month: { originId: origin.id, month: mk } } });
    if (existingOm) await prisma.ga4OriginMetric.update({ where: { id: existingOm.id }, data: { sessoes: sess, taxaEng, tempoMedio } });
    else await prisma.ga4OriginMetric.create({ data: { originId: origin.id, month: mk, sessoes: sess, taxaEng, tempoMedio } });
  }

  return { ok: true, month: mk };
}

// ─── Main orchestrator ─────────────────────────────────────────────────────────

async function syncClient(clientId) {
  const connections = await prisma.platformConnection.findMany({
    where: { clientId, status: "CONNECTED" },
  });

  const results = {};

  for (const conn of connections) {
    if (!conn.accessToken) continue;
    try {
      if (conn.platform === "META") {
        results.meta = await syncMeta(clientId, conn);
      } else if (conn.platform === "LINKEDIN") {
        results.linkedin = await syncLinkedin(clientId, conn);
      } else if (conn.platform === "GOOGLE_ANALYTICS") {
        results.ga4 = await syncGa4(clientId, conn);
      }
      await prisma.platformConnection.update({
        where: { id: conn.id },
        data: { lastSyncAt: new Date() },
      });
    } catch (err) {
      console.error(`[sync] Erro em ${conn.platform}:`, err.message);
      results[conn.platform.toLowerCase()] = { ok: false, error: err.message };
    }
  }

  return results;
}

async function getSyncStatus(clientId) {
  const connections = await prisma.platformConnection.findMany({
    where: { clientId },
    select: { platform: true, status: true, lastSyncAt: true, accountName: true, metadata: true },
  });
  // Indica se a página Meta foi selecionada
  return connections.map((c) => {
    const out = { ...c };
    if (c.platform === "META" && c.metadata) {
      try {
        const m = JSON.parse(c.metadata);
        out.pageSelected = !!(m.instagramBusinessAccountId && m.pageId);
        out.pageName = m.pageName || null;
        out.instagramName = m.instagramName || null;
      } catch { }
    }
    delete out.metadata;
    return out;
  });
}

module.exports = { syncClient, getSyncStatus };
