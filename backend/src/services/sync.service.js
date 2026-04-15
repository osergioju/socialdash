/**
 * Sync service — busca métricas das APIs de cada plataforma e salva no banco.
 *
 * Meta (Instagram Business Graph API)
 * LinkedIn (Organization Analytics API v2)
 * Google Analytics 4 (GA4 Data API v1beta)
 */

const https = require("https");
const prisma = require("../config/prisma");
const { encrypt, decrypt } = require("../utils/crypto");

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
  // Update stored token
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
  // Refresh Google tokens if near expiry (< 5 min)
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

function last12Months() {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return months;
}

// ─── META / INSTAGRAM ─────────────────────────────────────────────────────────

async function discoverInstagramAccount(token) {
  // Get Facebook pages managed by the user
  const pages = await httpGet(
    "https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account{id,name,username,followers_count}&limit=10",
    token
  );
  if (!pages.data || pages.data.length === 0) {
    throw new Error("Nenhuma Página do Facebook encontrada. Vincule uma Página ao Meta Business.");
  }
  // Find first page with IG business account
  for (const page of pages.data) {
    if (page.instagram_business_account?.id) {
      return {
        pageId: page.id,
        pageName: page.name,
        instagramBusinessAccountId: page.instagram_business_account.id,
        instagramName: page.instagram_business_account.name,
      };
    }
  }
  throw new Error("Nenhuma conta profissional do Instagram vinculada às Páginas do Facebook encontradas.");
}

async function syncMeta(clientId, conn) {
  const token = await getValidToken(conn);
  let meta = conn.metadata ? JSON.parse(conn.metadata) : {};

  // Discover IG Business Account if not cached
  if (!meta.instagramBusinessAccountId) {
    const discovered = await discoverInstagramAccount(token);
    meta = { ...meta, ...discovered };
    await prisma.platformConnection.update({
      where: { id: conn.id },
      data: { metadata: JSON.stringify(meta) },
    });
  }

  const igId = meta.instagramBusinessAccountId;
  const pageId = meta.pageId;

  // Get page access token for insights
  const pageTokenRes = await httpGet(
    `https://graph.facebook.com/v19.0/${pageId}?fields=access_token`,
    token
  );
  const pageToken = pageTokenRes.access_token || token;

  // Current month date range
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const since = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
  const until = Math.floor(new Date(year, month, 1).getTime() / 1000);
  const mk = monthKey(year, month);
  const ml = monthLabel(year, month);

  // Followers count
  const profileRes = await httpGet(
    `https://graph.facebook.com/v19.0/${igId}?fields=followers_count,media_count`,
    pageToken
  );
  const seguidores = profileRes.followers_count || 0;

  // Monthly insights - reach, impressions, profile_views
  const insightsRes = await httpGet(
    `https://graph.facebook.com/v19.0/${igId}/insights?metric=reach,impressions,profile_views&period=month&since=${since}&until=${until}`,
    pageToken
  );
  const insightMap = {};
  if (insightsRes.data) {
    for (const m of insightsRes.data) {
      const val = m.values?.find(v => {
        const t = new Date(v.end_time).getTime();
        return t > since * 1000 && t <= until * 1000;
      });
      insightMap[m.name] = val?.value || 0;
    }
  }

  // Media to get engagement data
  const mediaRes = await httpGet(
    `https://graph.facebook.com/v19.0/${igId}/media?fields=id,media_type,timestamp,like_count,comments_count,shares_count,saved,reach,impressions&limit=50&since=${since}&until=${until}`,
    pageToken
  );
  const posts = mediaRes.data || [];

  // Categorize posts
  let feedPosts = [], reels = [], stories = [];
  let totalLikes = 0, totalComments = 0, totalSaved = 0, totalShares = 0;
  let reelsReach = 0, reelsInteractions = 0;
  let storiesViews = 0;

  for (const p of posts) {
    const ts = new Date(p.timestamp);
    if (ts.getMonth() + 1 !== month || ts.getFullYear() !== year) continue;

    totalLikes += p.like_count || 0;
    totalComments += p.comments_count || 0;
    totalSaved += p.saved || 0;
    totalShares += p.shares_count || 0;

    if (p.media_type === "REEL") {
      reels.push(p);
      reelsReach += p.reach || 0;
      reelsInteractions += (p.like_count || 0) + (p.comments_count || 0) + (p.saved || 0);
    } else if (p.media_type === "STORY") {
      stories.push(p);
      storiesViews += p.impressions || 0;
    } else {
      feedPosts.push(p);
    }
  }

  const totalInteracoes = totalLikes + totalComments + totalSaved + totalShares;

  // New followers (approximation from follower_count insights)
  const followerInsights = await httpGet(
    `https://graph.facebook.com/v19.0/${igId}/insights?metric=follower_count&period=day&since=${since}&until=${until}`,
    pageToken
  ).catch(() => ({ data: [] }));
  let novosSeguidores = 0;
  if (followerInsights.data?.[0]?.values) {
    for (const v of followerInsights.data[0].values) {
      if (v.value > 0) novosSeguidores += v.value;
    }
  }

  // Upsert instagram metric (manual find+update/create for old Postgres compatibility)
  const igData = {
    monthLabel: ml,
    seguidores,
    novosSeguidores,
    alcanceOrganico: insightMap.reach || 0,
    visualizacoes: insightMap.impressions || 0,
    interacoes: totalInteracoes,
    visitasPerfil: insightMap.profile_views || 0,
    postagensTotal: feedPosts.length + reels.length,
    reelsQtd: reels.length,
    reelsAlcance: reelsReach,
    reelsInteracoes: reelsInteractions,
    storiesQtd: stories.length,
    storiesViews,
    curtidasPosts: totalLikes,
    comentariosPosts: totalComments,
    salvamentosPosts: totalSaved,
    compartilhamentosPosts: totalShares,
  };
  const existingIg = await prisma.instagramMetric.findUnique({ where: { clientId_month: { clientId, month: mk } } });
  if (existingIg) {
    await prisma.instagramMetric.update({ where: { id: existingIg.id }, data: igData });
  } else {
    await prisma.instagramMetric.create({ data: { clientId, month: mk, ...igData } });
  }

  // City audience data
  const audienceRes = await httpGet(
    `https://graph.facebook.com/v19.0/${igId}/insights?metric=audience_city&period=lifetime`,
    pageToken
  ).catch(() => ({ data: [] }));
  if (audienceRes.data?.[0]?.values?.[0]?.value) {
    const cityData = audienceRes.data[0].values[0].value;
    for (const [cityKey, count] of Object.entries(cityData).slice(0, 10)) {
      const cityName = cityKey.replace(/_/g, " ");
      let city = await prisma.city.findUnique({ where: { clientId_name_platform: { clientId, name: cityName, platform: "INSTAGRAM" } } });
      if (!city) city = await prisma.city.create({ data: { clientId, name: cityName, platform: "INSTAGRAM" } });
      const existingCm = await prisma.cityMetric.findUnique({ where: { cityId_month: { cityId: city.id, month: mk } } });
      if (existingCm) await prisma.cityMetric.update({ where: { id: existingCm.id }, data: { seguidores: count } });
      else await prisma.cityMetric.create({ data: { cityId: city.id, month: mk, seguidores: count } });
    }
  }

  return { ok: true, month: mk };
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
  // Get org details
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
  const orgId = meta.organizationId;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const mk = monthKey(year, month);
  const ml = monthLabel(year, month);

  // Follower stats
  const followerRes = await httpGet(
    `https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${orgUrn}`,
    token
  ).catch(() => ({}));
  const followerStats = followerRes.elements?.[0] || {};
  const seguidores = followerStats.totalFollowerCount || 0;
  const novosSeguidores = followerStats.followerGains?.organicFollowerGain || 0;

  // Page stats (impressions, reach) - monthly granularity
  const startMs = new Date(year, month - 1, 1).getTime();
  const endMs = new Date(year, month, 1).getTime() - 1;
  const pageStatsRes = await httpGet(
    `https://api.linkedin.com/v2/organizationPageStatistics?q=organizationalEntity&organizationalEntity=${orgUrn}&timeIntervals.timeGranularityType=MONTH&timeIntervals.timeRange.start=${startMs}&timeIntervals.timeRange.end=${endMs}`,
    token
  ).catch(() => ({}));
  const pageEl = pageStatsRes.elements?.[0]?.totalPageStatistics || {};
  const impressoes = pageEl.views?.allPageViews?.pageViews || 0;
  const alcance = impressoes; // LI doesn't separate reach well in v2

  // Share stats (engajamento, cliques, reações)
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

  // Geo data (cities/regions)
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

  // Industry & function demographics
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

  const propertyId = meta.propertyId; // e.g. "properties/123456789"
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const mk = monthKey(year, month);
  const ml = monthLabel(year, month);

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  // Main metrics report
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
  const tempoMedioEngajamento = Math.round(get(6) / Math.max(usuariosAtivos, 1)); // duration / users = avg seconds
  const viewsPorSessao = parseFloat(get(7).toFixed(2));
  const numEventos = Math.round(get(8));

  const ga4Data = { monthLabel: ml, usuariosAtivos, novosUsuarios, usuariosTotais, sessoes, sessoesEngajadas, taxaEngajamento, tempoMedioEngajamento, viewsPorSessao, numEventos };
  const existingGa4 = await prisma.ga4Metric.findUnique({ where: { clientId_month: { clientId, month: mk } } });
  if (existingGa4) await prisma.ga4Metric.update({ where: { id: existingGa4.id }, data: ga4Data });
  else await prisma.ga4Metric.create({ data: { clientId, month: mk, ...ga4Data } });

  // Pages report
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

  // Origins/traffic sources report
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
    select: { platform: true, status: true, lastSyncAt: true, accountName: true },
  });
  return connections;
}

module.exports = { syncClient, getSyncStatus };
