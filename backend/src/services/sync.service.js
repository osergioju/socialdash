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
const { categorizeInstagramPosts } = require("./gemini.service");

const IG_API_VERSION = "v22.0";

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function httpGet(url, token, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: { Authorization: `Bearer ${token}`, ...extraHeaders },
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
  if (!conn.refreshToken) {
    console.error("[ga4/refresh] FALHA: conn.refreshToken é null — usuário precisa reconectar o GA4");
    throw new Error("Sem refresh_token para GA4 — reconecte a integração");
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("[ga4/refresh] FALHA: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET vazios no .env");
    throw new Error("GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados no .env deste ambiente");
  }
  const refreshToken = decrypt(conn.refreshToken);
  console.log("[ga4/refresh] Renovando access_token via refresh_token...");
  const res = await httpPostForm("https://oauth2.googleapis.com/token", {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
  });
  if (!res.access_token) {
    console.error("[ga4/refresh] FALHA na renovação — resposta do Google:", JSON.stringify(res));
    const cause =
      res.error === "invalid_grant"
        ? "refresh_token inválido ou revogado (app em modo Teste expira em 7 dias, ou usuário revogou acesso)"
        : res.error_description || res.error || "unknown";
    throw new Error(`Falha ao renovar token Google: ${cause}`);
  }
  console.log("[ga4/refresh] Token renovado com sucesso, expira em", res.expires_in, "s");
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
  if (conn.platform === "GOOGLE_ANALYTICS") {
    if (!conn.expiresAt) {
      console.warn("[ga4/token] expiresAt é null — não é possível verificar expiração, usando token atual");
      return token;
    }
    const msUntilExpiry = new Date(conn.expiresAt) - Date.now();
    console.log(`[ga4/token] expiresAt=${conn.expiresAt.toISOString()} | faltam ${Math.round(msUntilExpiry / 1000)}s`);
    if (msUntilExpiry < 5 * 60 * 1000) {
      console.log("[ga4/token] Token expirando/expirado, renovando...");
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
const IG_MONTHS_BACK = 12;

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
        // IMAGE, CAROUSEL_ALBUM v22.0: reach + saved + shares disponíveis
        metrics = "reach,saved,shares";
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
          const val =
            metric.values?.[0]?.value ??
            metric.total_value?.value ?? // 🔥 FALTAVA ISSO
            metric.value ??
            0;
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
  const since30Unix = Math.floor(new Date(now.getTime() - 30 * 24 * 3600 * 1000).getTime() / 1000);
  const untilUnix = Math.floor(now.getTime() / 1000);

  // ── Follower count: uma chamada por mês, cobrindo todos os IG_MONTHS_BACK meses ──
  // follower_count retorna DELTA DIÁRIO (ganho/perda por dia), NÃO total acumulado.
  // Fazemos N chamadas (uma por mês) com janela ≤30 dias cada, igual ao padrão dos outros insights.
  const dailyNetGains = {};
  for (let i = 0; i < IG_MONTHS_BACK; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const mEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const mStartUnix = Math.floor(mStart.getTime() / 1000);
    const mEndUnix   = Math.min(Math.floor(mEnd.getTime() / 1000), mStartUnix + 30 * 24 * 3600);
    const res = await httpGet(
      `https://graph.facebook.com/${IG_API_VERSION}/${igId}/insights` +
      `?metric=follower_count&period=day&since=${mStartUnix}&until=${mEndUnix}`,
      pageToken
    ).catch(() => ({ data: [] }));
    for (const v of (res.data?.[0]?.values || [])) {
      const day = v.end_time?.substring(0, 10);
      if (day && typeof v.value === "number") dailyNetGains[day] = v.value;
    }
  }
  console.log(`[sync/meta] follower gains coletados — ${Object.keys(dailyNetGains).length} dias`);

  // ── Media: pagina até cobrir IG_MONTHS_BACK meses ────────────────────────
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - IG_MONTHS_BACK + 1, 1);
  const allPosts = [];
  let mediaUrl = `https://graph.facebook.com/${IG_API_VERSION}/${igId}/media` +
    `?fields=id,media_type,timestamp,like_count,comments_count,caption&limit=100`;

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

  let previousFollowers = currentFollowers;

  for (const { year, month } of months) {
    const mk = monthKey(year, month);
    const ml = monthLabel(year, month);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);
    const mkStr = `${year}-${String(month).padStart(2, "0")}`;

    // reach, views, profile_views — todos metric_type=total_value em v22.0
    const mStartUnix = Math.floor(monthStart.getTime() / 1000);
    const mEndUnixFull = Math.floor(monthEnd.getTime() / 1000);
    // API limit: max 30 days (2592000s) between since and until
    const mEndUnix = Math.min(mEndUnixFull, mStartUnix + 30 * 24 * 3600);
    const insRes = await httpGet(
      `https://graph.facebook.com/${IG_API_VERSION}/${igId}/insights` +
      `?metric=reach,views,profile_views&metric_type=total_value&period=day&since=${mStartUnix}&until=${mEndUnix}`,
      pageToken
    ).catch(() => ({ data: [] }));

    let reach = 0, views = 0, profileViews = 0;
    if (insRes.error) {
      console.warn(`[sync/meta] ${mk} insights error: ${insRes.error.message}`);
    } else {
      for (const entry of (insRes.data || [])) {
        const val = entry.total_value?.value ?? 0;
        if (entry.name === "reach") reach = val;
        if (entry.name === "views") views = val;
        if (entry.name === "profile_views") profileViews = val;
      }
    }
    console.log(`[sync/meta] ${mk} reach=${reach} views=${views} profile_views=${profileViews}`);

    // novosSeguidores: soma dos ganhos positivos do mês (dados disponíveis nos últimos 30 dias)
    const novosSeguidores = Object.entries(dailyNetGains)
      .filter(([d]) => d.startsWith(mkStr))
      .reduce((s, [, v]) => s + Math.max(0, v), 0);

    // Agrega posts deste mês
    let feedCount = 0, reelsCount = 0, likes = 0, comments = 0;
    let reelsReach = 0, reelsInteractions = 0;
    let savedPosts = 0, sharesPosts = 0;

    for (const p of filteredPosts) {
      const ts = new Date(p.timestamp);
      if (ts < monthStart || ts >= monthEnd) continue;
      const ins = insightsMap[p.id] || {};
      const pLikes = p.like_count ?? 0;
      const pComments = p.comments_count ?? 0;
      likes += pLikes;
      comments += pComments;
      if (p.media_type === "REEL" || p.media_type === "VIDEO") {
        reelsCount++;
        reelsReach += ins.reach ?? 0;
        reelsInteractions += ins.total_interactions ?? (pLikes + pComments);
      } else if (p.media_type === "IMAGE" || p.media_type === "CAROUSEL_ALBUM") {
        feedCount++;
        savedPosts  += ins.saved  ?? 0;
        sharesPosts += ins.shares ?? 0;
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

    // seguidores: propagado para trás a partir de currentFollowers (mais recente → mais antigo)
    const seguidores = previousFollowers;
    // Variação líquida do mês para estimar o mês anterior
    const monthNetChange = Object.entries(dailyNetGains)
      .filter(([d]) => d.startsWith(mkStr))
      .reduce((s, [, v]) => s + v, 0);
    previousFollowers = Math.max(0, previousFollowers - monthNetChange);

    const existing = await prisma.instagramMetric.findUnique({ where: { clientId_month: { clientId, month: mk } } });

    // novosSeguidores: só sobrescreve se temos dados reais (dentro dos 90 dias)
    // Para meses históricos sem dados, preserva o que já está no banco
    const hasGainData = Object.keys(dailyNetGains).some(d => d.startsWith(mkStr));
    const finalNovos = hasGainData ? novosSeguidores : (existing?.novosSeguidores ?? 0);

    const igData = {
      monthLabel: ml,
      seguidores,
      novosSeguidores: finalNovos,
      alcanceOrganico: reach ?? 0,
      visualizacoes: views ?? 0,
      interacoes: likes + comments,
      visitasPerfil: profileViews ?? 0,
      postagensTotal: feedCount + reelsCount,
      reelsQtd: reelsCount,
      reelsAlcance: reelsReach,
      reelsInteracoes: reelsInteractions,
      storiesQtd: storiesCount,
      storiesViews,
      curtidasPosts: likes,
      comentariosPosts: comments,
      salvamentosPosts: savedPosts,
      compartilhamentosPosts: sharesPosts,
    };

    if (existing) {
      await prisma.instagramMetric.update({ where: { id: existing.id }, data: igData });
    } else {
      await prisma.instagramMetric.create({ data: { clientId, month: mk, ...igData } });
    }
  }

  // ── Cidades (snapshot do mês atual) ──────────────────────────────────────
  // reached_audience_demographics também requer metric_type=total_value
  const audienceRes = await httpGet(
    `https://graph.facebook.com/${IG_API_VERSION}/${igId}/insights` +
    `?metric=reached_audience_demographics` +
    `&metric_type=total_value` +
    `&period=lifetime` +
    `&timeframe=this_month` + // 🔥 OBRIGATÓRIO
    `&breakdown=city`,
    pageToken
  ).catch(() => ({ data: [] }));

  if (audienceRes.error) {
    console.warn("[sync/meta] cities error:", audienceRes.error.message);
  }
  const cityRawData = audienceRes.data?.[0]?.total_value?.breakdowns?.[0]?.results;
  console.log(`[sync/meta] cities raw entries: ${Array.isArray(cityRawData) ? cityRawData.length : 0}`);
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

  // ── Salva posts individuais (para categorização por IA) ──────────────────
  for (const p of filteredPosts) {
    if (p.media_type === "STORY") continue;
    const ts = new Date(p.timestamp);
    const mk = monthKey(ts.getFullYear(), ts.getMonth() + 1);
    const ins = insightsMap[p.id] || {};
    const postData = {
      caption:   p.caption   || null,
      mediaType: p.media_type,
      timestamp: ts,
      month:     mk,
      likes:     p.like_count     ?? 0,
      comments:  p.comments_count ?? 0,
      reach:     ins.reach        ?? 0,
      saved:     ins.saved        ?? 0,
      shares:    ins.shares       ?? 0,
      plays:     ins.plays        ?? 0,
    };
    const existing = await prisma.instagramPost.findUnique({ where: { clientId_postId: { clientId, postId: p.id } } });
    if (existing) {
      await prisma.instagramPost.update({ where: { id: existing.id }, data: postData });
    } else {
      await prisma.instagramPost.create({ data: { clientId, postId: p.id, ...postData } });
    }
  }

  // ── Categoriza posts por tema via IA (async, não bloqueia o sync) ─────────
  categorizeAndSaveThemes(clientId).catch((e) =>
    console.error("[sync/meta] categorização por IA falhou:", e.message)
  );

  return { ok: true, months: months.length, posts: filteredPosts.length };
}

async function categorizeAndSaveThemes(clientId) {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { name: true } });
  const posts = await prisma.instagramPost.findMany({
    where: { clientId, mediaType: { not: "STORY" }, caption: { not: null } },
    orderBy: { likes: "desc" },
    take: 80,
  });

  const postsWithCaption = posts.filter((p) => p.caption && p.caption.trim().length > 5);
  if (postsWithCaption.length < 3) {
    console.log(`[categorize/ig] client=${clientId} — menos de 3 posts com legenda, pulando categorização`);
    return;
  }

  console.log(`[categorize/ig] client=${clientId} — categorizando ${postsWithCaption.length} posts...`);

  const result = await categorizeInstagramPosts({
    clientName: client?.name ?? "Cliente",
    posts: postsWithCaption.map((p, i) => ({
      index:    i + 1,
      id:       p.id,
      caption:  p.caption,
      likes:    p.likes,
      comments: p.comments,
      reach:    p.reach,
      shares:   p.shares,
      month:    p.month,
    })),
  });

  if (!Array.isArray(result.themes) || result.themes.length === 0) return;

  // Limpa temas existentes do Instagram
  const existingThemes = await prisma.theme.findMany({ where: { clientId, platform: "INSTAGRAM" } });
  for (const t of existingThemes) {
    await prisma.themeMetric.deleteMany({ where: { themeId: t.id } });
  }
  await prisma.theme.deleteMany({ where: { clientId, platform: "INSTAGRAM" } });

  const currentMonth = monthKey(new Date().getFullYear(), new Date().getMonth() + 1);

  for (const themeData of result.themes) {
    if (!themeData.tema || !Array.isArray(themeData.postIndexes)) continue;

    const theme = await prisma.theme.create({
      data: { clientId, tema: themeData.tema, icon: themeData.icon || "📌", platform: "INSTAGRAM" },
    });

    const themePosts = themeData.postIndexes
      .map((i) => postsWithCaption[i - 1])
      .filter(Boolean);

    if (themePosts.length === 0) continue;

    await prisma.instagramPost.updateMany({
      where: { id: { in: themePosts.map((p) => p.id) } },
      data: { themeId: theme.id },
    });

    const curtidas          = themePosts.reduce((s, p) => s + (p.likes    || 0), 0);
    const comentarios       = themePosts.reduce((s, p) => s + (p.comments || 0), 0);
    const compartilhamentos = themePosts.reduce((s, p) => s + (p.shares   || 0), 0);
    const alcanceMedio      = Math.round(themePosts.reduce((s, p) => s + (p.reach || 0), 0) / themePosts.length);

    await prisma.themeMetric.create({
      data: { themeId: theme.id, month: currentMonth, curtidas, comentarios, compartilhamentos, alcanceMedio },
    });
  }

  console.log(`[categorize/ig] ✅ ${result.themes.length} temas gerados para client=${clientId}`);
}

// ─── LINKEDIN ─────────────────────────────────────────────────────────────────

// Taxonomia de funções do LinkedIn (lista fixa de 26 — urn:li:function:{id}).
// Fonte: https://learn.microsoft.com/linkedin/shared/references/v2/standardized-data/functions
const LI_FUNCTIONS = {
  1: "Contabilidade", 2: "Administrativo", 3: "Artes e Design", 4: "Desenvolvimento de Negócios",
  5: "Serviços Comunitários e Sociais", 6: "Consultoria", 7: "Educação", 8: "Engenharia",
  9: "Empreendedorismo", 10: "Finanças", 11: "Serviços de Saúde", 12: "Recursos Humanos",
  13: "Tecnologia da Informação", 14: "Jurídico", 15: "Marketing", 16: "Mídia e Comunicação",
  17: "Forças Militares e de Proteção", 18: "Operações", 19: "Gestão de Produto",
  20: "Gestão de Programas e Projetos", 21: "Compras", 22: "Garantia de Qualidade",
  23: "Imobiliário", 24: "Pesquisa", 25: "Vendas", 26: "Suporte",
};

// Versão da API versionada (rest/*) do LinkedIn. Versões expiram ~1 ano; quando
// der 426 "version not active", basta atualizar a env LINKEDIN_API_VERSION.
const LI_VERSION = process.env.LINKEDIN_API_VERSION || "202506";

// Indústrias são centenas e mudam — busca os nomes na API (rest/industries, só
// retorna en_US) e cacheia em memória. O endpoint v2/industries não aceita locale.
const _industryCache = new Map(); // id -> nome
async function liIndustryName(token, urn) {
  const id = String(urn || "").split(":").pop();
  if (!id) return "Indústria desconhecida";
  if (_industryCache.has(id)) return _industryCache.get(id);
  const res = await httpGet(
    `https://api.linkedin.com/rest/industries/${id}`,
    token,
    { "LinkedIn-Version": LI_VERSION }
  ).catch(() => null);
  const nome =
    res?.name?.localized?.en_US ||
    (res?.name?.localized && Object.values(res.name.localized)[0]) ||
    `Indústria ${id}`;
  _industryCache.set(id, nome);
  return nome;
}

function liFunctionName(urn) {
  const id = parseInt(String(urn || "").split(":").pop(), 10);
  return LI_FUNCTIONS[id] || (id ? `Função ${id}` : "Função desconhecida");
}

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

// Busca os posts da organização (rest/posts, API versionada). Pagina até `max`.
async function fetchLinkedinPosts(token, orgUrnRaw, max = 50) {
  const enc = encodeURIComponent(orgUrnRaw);
  const out = [];
  let start = 0;
  while (out.length < max) {
    const res = await httpGet(
      `https://api.linkedin.com/rest/posts?q=author&author=${enc}&count=20&start=${start}&sortBy=LAST_MODIFIED`,
      token,
      { "LinkedIn-Version": LI_VERSION }
    ).catch(() => null);
    const els = res?.elements || [];
    if (els.length === 0) break;
    out.push(...els);
    if (els.length < 20) break;
    start += 20;
  }
  return out.slice(0, max);
}

// Engajamento por post via shareStatistics (facet ugcPosts/shares, lotes de 20).
async function fetchLinkedinPostStats(token, orgUrnRaw, postUrns) {
  const enc = encodeURIComponent(orgUrnRaw);
  const stats = {}; // urn -> totalShareStatistics
  const groups = { ugcPosts: [], shares: [] };
  for (const urn of postUrns) {
    if (urn.includes(":ugcPost:")) groups.ugcPosts.push(urn);
    else if (urn.includes(":share:")) groups.shares.push(urn);
  }
  for (const [facet, urns] of Object.entries(groups)) {
    for (let i = 0; i < urns.length; i += 20) {
      const list = urns.slice(i, i + 20).map(encodeURIComponent).join(",");
      const res = await httpGet(
        `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${enc}&${facet}=List(${list})`,
        token,
        { "LinkedIn-Version": LI_VERSION }
      ).catch(() => null);
      for (const el of (res?.elements || [])) {
        const key = el.ugcPost || el.share;
        if (key) stats[key] = el.totalShareStatistics || {};
      }
    }
  }
  return stats;
}

// Busca posts, pega engajamento, categoriza em temas (Gemini) e salva (platform=LINKEDIN).
async function categorizeAndSaveLinkedinThemes(clientId, token, orgUrnRaw) {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { name: true } });
  const rawPosts = await fetchLinkedinPosts(token, orgUrnRaw, 50);
  const withText = rawPosts.filter((p) => (p.commentary || "").trim().length > 20);
  if (withText.length < 3) {
    console.log(`[categorize/li] client=${clientId} — menos de 3 posts com texto, pulando`);
    return;
  }

  const statsMap = await fetchLinkedinPostStats(token, orgUrnRaw, withText.map((p) => p.id));

  const posts = withText.map((p, i) => {
    const s = statsMap[p.id] || {};
    const likes = s.likeCount || 0, comments = s.commentCount || 0;
    const shares = Math.max(0, s.shareCount || 0), clicks = s.clickCount || 0;
    const d = new Date(p.publishedAt || p.createdAt || Date.now());
    return {
      index: i + 1, id: p.id, caption: p.commentary,
      likes, comments, shares, clicks,
      reach: s.uniqueImpressionsCount || 0,
      engajamento: likes + comments + shares + clicks,
      month: monthKey(d.getFullYear(), d.getMonth() + 1),
    };
  });

  const result = await categorizeInstagramPosts({
    clientName: client?.name ?? "Cliente",
    posts,
    platformLabel: "LinkedIn",
  });
  if (!Array.isArray(result.themes) || result.themes.length === 0) return;

  // Limpa temas LinkedIn antigos
  const existing = await prisma.theme.findMany({ where: { clientId, platform: "LINKEDIN" } });
  for (const t of existing) await prisma.themeMetric.deleteMany({ where: { themeId: t.id } });
  await prisma.theme.deleteMany({ where: { clientId, platform: "LINKEDIN" } });

  const currentMonth = monthKey(new Date().getFullYear(), new Date().getMonth() + 1);

  for (const themeData of result.themes) {
    if (!themeData.tema || !Array.isArray(themeData.postIndexes)) continue;
    const tp = themeData.postIndexes.map((i) => posts[i - 1]).filter(Boolean);
    if (tp.length === 0) continue;

    const theme = await prisma.theme.create({
      data: { clientId, tema: themeData.tema, icon: themeData.icon || "📌", platform: "LINKEDIN" },
    });

    await prisma.themeMetric.create({
      data: {
        themeId: theme.id, month: currentMonth,
        engajamento:  tp.reduce((s, p) => s + p.engajamento, 0),
        cliques:      tp.reduce((s, p) => s + p.clicks, 0),
        curtidas:     tp.reduce((s, p) => s + p.likes, 0),
        comentarios:  tp.reduce((s, p) => s + p.comments, 0),
        alcanceMedio: Math.round(tp.reduce((s, p) => s + p.reach, 0) / tp.length),
      },
    });
  }
  console.log(`[categorize/li] ✅ ${result.themes.length} temas LinkedIn para client=${clientId}`);
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
  const LI_MONTHS_BACK = 12;

  // ── Follower stats: recortes por indústria/função/região (snapshot atual) ──
  const followerRes = await httpGet(
    `https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${orgUrn}`,
    token
  ).catch(() => ({}));
  const followerStats = followerRes.elements?.[0] || {};

  // ── Total de seguidores: vem do networkSizes (followerStatistics não traz total) ──
  const netRes = await httpGet(
    `https://api.linkedin.com/v2/networkSizes/${orgUrn}?edgeType=CompanyFollowedByMember`,
    token
  ).catch(() => ({}));
  const currentSeguidores = netRes.firstDegreeSize || 0;

  // ── Share stats: somente LIFETIME é permitido neste tier (timeIntervals → 403).
  //    organizationPageStatistics retorna 404 neste tier, então não é usado. ──
  const shareStatsRes = await httpGet(
    `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${orgUrn}`,
    token
  ).catch(() => ({}));
  const share = shareStatsRes.elements?.[0]?.totalShareStatistics || {};

  const impressoes  = share.impressionCount       || 0;
  const alcance     = share.uniqueImpressionsCount || 0;
  const cliques     = share.clickCount            || 0;
  const reacoes     = share.likeCount             || 0;
  const comentarios = share.commentCount          || 0;
  const compart     = share.shareCount            || 0;
  // Engajamento = total de interações (curtidas + comentários + compartilhamentos + cliques)
  const engajamento = reacoes + comentarios + compart + cliques;

  // ── Persiste APENAS o mês atual. A API só dá totais lifetime (não há série
  //    histórica neste tier); o histórico mês-a-mês se constrói a cada sync. ──
  const yr = now.getFullYear();
  const mo = now.getMonth() + 1;
  const mk = monthKey(yr, mo);
  const ml = monthLabel(yr, mo);

  const liData = {
    monthLabel: ml, seguidores: currentSeguidores, novosSeguidores: 0,
    alcance, impressoes, engajamento, cliques, reacoes, postagens: compart,
  };
  const existingLi = await prisma.linkedinMetric.findUnique({ where: { clientId_month: { clientId, month: mk } } });
  if (existingLi) await prisma.linkedinMetric.update({ where: { id: existingLi.id }, data: liData });
  else            await prisma.linkedinMetric.create({ data: { clientId, month: mk, ...liData } });

  // ── Geo, indústrias e funções (snapshot do mês atual apenas) ─────────────
  const currentMk = monthKey(now.getFullYear(), now.getMonth() + 1);

  const geoList = followerStats.followerCountsByRegion || followerStats.followerCountsByCountry || [];
  for (const geo of geoList.slice(0, 10)) {
    const geoUrn   = geo.geo || "";
    const cityName = geo.geoCountryName || (geoUrn ? `Região ${geoUrn.split(":").pop()}` : "Desconhecido");
    const count    = geo.followerCounts?.organicFollowerCount || 0;
    if (!count) continue;
    let city = await prisma.city.findUnique({ where: { clientId_name_platform: { clientId, name: cityName, platform: "LINKEDIN" } } });
    if (!city) city = await prisma.city.create({ data: { clientId, name: cityName, platform: "LINKEDIN" } });
    const existingCm = await prisma.cityMetric.findUnique({ where: { cityId_month: { cityId: city.id, month: currentMk } } });
    if (existingCm) await prisma.cityMetric.update({ where: { id: existingCm.id }, data: { seguidores: count } });
    else            await prisma.cityMetric.create({ data: { cityId: city.id, month: currentMk, seguidores: count } });
  }

  if (followerStats.followerCountsByIndustry) {
    for (const ind of followerStats.followerCountsByIndustry.slice(0, 10)) {
      const indUrn = typeof ind.industry === "string" ? ind.industry : "";
      const nome   = ind.industryName || await liIndustryName(token, indUrn);
      const seg    = ind.followerCounts?.organicFollowerCount || 0;
      if (!seg) continue;
      let industry = await prisma.linkedinIndustry.findUnique({ where: { clientId_nome: { clientId, nome } } });
      if (!industry) industry = await prisma.linkedinIndustry.create({ data: { clientId, nome } });
      const existingMet = await prisma.linkedinIndustryMetric.findUnique({ where: { industryId_month: { industryId: industry.id, month: currentMk } } });
      if (existingMet) await prisma.linkedinIndustryMetric.update({ where: { id: existingMet.id }, data: { seguidores: seg } });
      else             await prisma.linkedinIndustryMetric.create({ data: { industryId: industry.id, month: currentMk, seguidores: seg } });
    }
  }

  if (followerStats.followerCountsByFunction) {
    for (const fn of followerStats.followerCountsByFunction.slice(0, 10)) {
      const fnUrn = typeof fn.function === "string" ? fn.function : "";
      const nome  = fn.functionName || liFunctionName(fnUrn);
      const seg   = fn.followerCounts?.organicFollowerCount || 0;
      if (!seg) continue;
      let role = await prisma.linkedinRole.findUnique({ where: { clientId_nome: { clientId, nome } } });
      if (!role) role = await prisma.linkedinRole.create({ data: { clientId, nome } });
      const existingMet = await prisma.linkedinRoleMetric.findUnique({ where: { roleId_month: { roleId: role.id, month: currentMk } } });
      if (existingMet) await prisma.linkedinRoleMetric.update({ where: { id: existingMet.id }, data: { seguidores: seg } });
      else             await prisma.linkedinRoleMetric.create({ data: { roleId: role.id, month: currentMk, seguidores: seg } });
    }
  }

  // ── Temas (ranking por engajamento): busca posts + categoriza via Gemini ──
  await categorizeAndSaveLinkedinThemes(clientId, token, meta.organizationUrn).catch((e) =>
    console.error(`[categorize/li] erro client=${clientId}:`, e.message)
  );

  return { ok: true, months: LI_MONTHS_BACK, month: currentMk };
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

  // First day of the month 12 months ago — e.g. "2025-05-01" when running in May 2026.
  // Anchors to complete months instead of a rolling 365-day window.
  const _now = new Date();
  const GA4_START = new Date(_now.getFullYear(), _now.getMonth() - 12, 1).toISOString().slice(0, 10);

  const mainReport = await httpPost(
    `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
    token,
    {
      dateRanges: [{ startDate: GA4_START, endDate: "today" }],
      dimensions: [{ name: "yearMonth" }],
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
      orderBys: [{ dimension: { dimensionName: "yearMonth" }, desc: false }],
    }
  );

  const pagesReport = await httpPost(
    `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
    token,
    {
      dateRanges: [{ startDate: GA4_START, endDate: "today" }],
      dimensions: [{ name: "yearMonth" }, { name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "userEngagementDuration" }],
      orderBys: [
        { dimension: { dimensionName: "yearMonth" }, desc: false },
        { metric: { metricName: "screenPageViews" }, desc: true },
      ],
      limit: 120,
    }
  );

  const originsReport = await httpPost(
    `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
    token,
    {
      dateRanges: [{ startDate: GA4_START, endDate: "today" }],
      dimensions: [{ name: "yearMonth" }, { name: "sessionSource" }],
      metrics: [
        { name: "sessions" },
        { name: "engagementRate" },
        { name: "userEngagementDuration" },
        { name: "activeUsers" },
      ],
      orderBys: [
        { dimension: { dimensionName: "yearMonth" }, desc: false },
        { metric: { metricName: "sessions" }, desc: true },
      ],
      limit: 120,
    }
  );

  // GA4 yearMonth: "YYYYMM" (6 chars)
  const ymToMk = (ym) => `${ym.slice(0, 4)}-${ym.slice(4, 6)}`;
  if (mainReport.error) {
    console.error(`[ga4] ❌ Erro da API — startDate=${GA4_START}:`, JSON.stringify(mainReport.error));
    throw new Error(`GA4 API error: ${mainReport.error.message || mainReport.error.status || JSON.stringify(mainReport.error)}`);
  }
  console.log(`[ga4] startDate=${GA4_START} | API retornou ${mainReport.rows?.length ?? 0} meses:`, (mainReport.rows || []).map(r => r.dimensionValues?.[0]?.value));
  const ymToMl = (ym) => `${ym.slice(4, 6)}/${ym.slice(0, 4)}`;

  // Build pages lookup: mk → top-10 entries (already sorted desc by API)
  const pagesMap = {};
  for (const row of pagesReport.rows || []) {
    const ym     = row.dimensionValues?.[0]?.value || "";
    const pagina = row.dimensionValues?.[1]?.value || "/";
    const views  = Math.round(parseFloat(row.metricValues?.[0]?.value || "0"));
    const tempo  = Math.round(parseFloat(row.metricValues?.[1]?.value || "0") / Math.max(views, 1));
    const mk     = ymToMk(ym);
    if (!pagesMap[mk]) pagesMap[mk] = [];
    if (pagesMap[mk].length < 10) pagesMap[mk].push({ pagina, views, tempo });
  }

  // Build origins lookup: mk → top-10 entries
  const originsMap = {};
  for (const row of originsReport.rows || []) {
    const ym       = row.dimensionValues?.[0]?.value || "";
    const fonte    = row.dimensionValues?.[1]?.value || "(direct)";
    const sess     = Math.round(parseFloat(row.metricValues?.[0]?.value || "0"));
    const taxaEng  = parseFloat((parseFloat(row.metricValues?.[1]?.value || "0") * 100).toFixed(1));
    const users    = Math.round(parseFloat(row.metricValues?.[3]?.value || "1"));
    const tempoMedio = Math.round(parseFloat(row.metricValues?.[2]?.value || "0") / Math.max(users, 1));
    const mk       = ymToMk(ym);
    if (!originsMap[mk]) originsMap[mk] = [];
    if (originsMap[mk].length < 10) originsMap[mk].push({ fonte, sess, taxaEng, tempoMedio });
  }

  // Persist each month
  let savedMonths = 0;
  let lastMk = null;

  for (const row of mainReport.rows || []) {
    const ym = row.dimensionValues?.[0]?.value || "";
    if (ym.length !== 6) continue;
    const mk = ymToMk(ym);
    const ml = ymToMl(ym);
    const v  = row.metricValues || [];
    const get = (i) => parseFloat(v[i]?.value || "0");

    const usuariosAtivos        = Math.round(get(0));
    const novosUsuarios         = Math.round(get(1));
    const usuariosTotais        = Math.round(get(2));
    const sessoes               = Math.round(get(3));
    const sessoesEngajadas      = Math.round(get(4));
    const taxaEngajamento       = parseFloat((get(5) * 100).toFixed(2));
    const tempoMedioEngajamento = Math.round(get(6) / Math.max(usuariosAtivos, 1));
    const viewsPorSessao        = parseFloat(get(7).toFixed(2));
    const numEventos            = Math.round(get(8));

    const ga4Data = { monthLabel: ml, usuariosAtivos, novosUsuarios, usuariosTotais, sessoes, sessoesEngajadas, taxaEngajamento, tempoMedioEngajamento, viewsPorSessao, numEventos };
    const existing = await prisma.ga4Metric.findUnique({ where: { clientId_month: { clientId, month: mk } } });
    if (existing) await prisma.ga4Metric.update({ where: { id: existing.id }, data: ga4Data });
    else await prisma.ga4Metric.create({ data: { clientId, month: mk, ...ga4Data } });

    for (const { pagina, views, tempo } of pagesMap[mk] || []) {
      const label = pagina === "/" ? "Home" : pagina.replace(/^\/|\/$/g, "").split("/").pop() || pagina;
      let page = await prisma.ga4Page.findUnique({ where: { clientId_pagina: { clientId, pagina } } });
      if (page) await prisma.ga4Page.update({ where: { id: page.id }, data: { label } });
      else page = await prisma.ga4Page.create({ data: { clientId, pagina, label } });
      const existingPm = await prisma.ga4PageMetric.findUnique({ where: { pageId_month: { pageId: page.id, month: mk } } });
      if (existingPm) await prisma.ga4PageMetric.update({ where: { id: existingPm.id }, data: { views, tempoMedio: tempo } });
      else await prisma.ga4PageMetric.create({ data: { pageId: page.id, month: mk, views, tempoMedio: tempo } });
    }

    for (const { fonte, sess, taxaEng, tempoMedio } of originsMap[mk] || []) {
      let origin = await prisma.ga4Origin.findUnique({ where: { clientId_fonte: { clientId, fonte } } });
      if (!origin) origin = await prisma.ga4Origin.create({ data: { clientId, fonte } });
      const existingOm = await prisma.ga4OriginMetric.findUnique({ where: { originId_month: { originId: origin.id, month: mk } } });
      if (existingOm) await prisma.ga4OriginMetric.update({ where: { id: existingOm.id }, data: { sessoes: sess, taxaEng, tempoMedio } });
      else await prisma.ga4OriginMetric.create({ data: { originId: origin.id, month: mk, sessoes: sess, taxaEng, tempoMedio } });
    }

    savedMonths++;
    lastMk = mk;
  }

  return { ok: true, months: savedMonths, month: lastMk };
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
      console.error(`[sync] ❌ Erro em ${conn.platform} (clientId=${clientId}):`, err.message);
      if (err.stack) console.error(err.stack);
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

module.exports = {
  syncClient, getSyncStatus, categorizeAndSaveThemes, getValidToken,
  // Helpers reutilizados por outros módulos (ex.: Campanhas)
  httpGet, httpPost, fetchLinkedinPosts, fetchLinkedinPostStats, IG_API_VERSION, LI_VERSION,
};
