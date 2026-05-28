const prisma = require("../config/prisma");
const { generateInsights } = require("./gemini.service");

// ─── In-memory TTL cache (5 min) ──────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map(); // key → { data, expiresAt }

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}
function cacheSet(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}
function invalidateCache(clientId) {
  for (const key of cache.keys()) {
    if (key.includes(`:${clientId}`)) cache.delete(key);
  }
}

// ─── Instagram ────────────────────────────────────────────────────────────────
async function getInstagramMetrics(clientId) {
  const key = `instagram:${clientId}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const metrics = await prisma.instagramMetric.findMany({
    where: { clientId },
    orderBy: { month: "asc" },
  });

  const cities = await prisma.city.findMany({
    where: { clientId, platform: "INSTAGRAM" },
    include: { metrics: { orderBy: { month: "asc" } } },
  });

  const rawThemes = await prisma.theme.findMany({
    where: { clientId, platform: "INSTAGRAM" },
    include: { metrics: { orderBy: { month: "desc" }, take: 1 } },
    orderBy: { createdAt: "asc" },
  });

  const themes = rawThemes.map(({ metrics: tm, ...t }) => ({
    ...t,
    curtidas:          tm[0]?.curtidas          ?? null,
    comentarios:       tm[0]?.comentarios       ?? null,
    compartilhamentos: tm[0]?.compartilhamentos ?? null,
    alcanceMedio:      tm[0]?.alcanceMedio      ?? null,
  }));

  const result = { metrics, cities, themes };
  cacheSet(key, result);
  return result;
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────
async function getLinkedinMetrics(clientId) {
  const key = `linkedin:${clientId}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const metrics = await prisma.linkedinMetric.findMany({
    where: { clientId },
    orderBy: { month: "asc" },
  });

  const cities = await prisma.city.findMany({
    where: { clientId, platform: "LINKEDIN" },
    include: { metrics: { orderBy: { month: "asc" } } },
  });

  const rawLiThemes = await prisma.theme.findMany({
    where: { clientId, platform: "LINKEDIN" },
    include: { metrics: { orderBy: { month: "desc" }, take: 1 } },
    orderBy: { createdAt: "asc" },
  });

  const themes = rawLiThemes.map(({ metrics: tm, ...t }) => ({
    ...t,
    engajamento:  tm[0]?.engajamento  ?? null,
    cliques:      tm[0]?.cliques      ?? null,
    alcanceMedio: tm[0]?.alcanceMedio ?? null,
  }));

  // Industries: fetch with most-recent metric, flatten for API response
  const rawIndustries = await prisma.linkedinIndustry.findMany({
    where: { clientId },
    include: { metrics: { orderBy: { month: "desc" }, take: 1 } },
  });

  const rawRoles = await prisma.linkedinRole.findMany({
    where: { clientId },
    include: { metrics: { orderBy: { month: "desc" }, take: 1 } },
  });

  const industries = rawIndustries
    .map((ind) => ({ id: ind.id, nome: ind.nome, seguidores: ind.metrics[0]?.seguidores ?? 0 }))
    .sort((a, b) => b.seguidores - a.seguidores);

  const roles = rawRoles
    .map((role) => ({ id: role.id, nome: role.nome, seguidores: role.metrics[0]?.seguidores ?? 0 }))
    .sort((a, b) => b.seguidores - a.seguidores);

  const result = { metrics, cities, themes, industries, roles };
  cacheSet(key, result);
  return result;
}

// ─── GA4 ──────────────────────────────────────────────────────────────────────
async function getGa4Metrics(clientId) {
  const key = `ga4:${clientId}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const metrics = await prisma.ga4Metric.findMany({
    where: { clientId },
    orderBy: { month: "asc" },
  });

  const pages = await prisma.ga4Page.findMany({
    where: { clientId },
    include: { metrics: { orderBy: { month: "asc" } } },
  });

  const origins = await prisma.ga4Origin.findMany({
    where: { clientId },
    include: { metrics: { orderBy: { month: "asc" } } },
  });

  const result = { metrics, pages, origins };
  cacheSet(key, result);
  return result;
}

// ─── Overview ─────────────────────────────────────────────────────────────────
async function getOverview(clientId) {
  const key = `overview:${clientId}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const [igLast, liFirst, liLast, ga4Last] = await Promise.all([
    prisma.instagramMetric.findFirst({ where: { clientId }, orderBy: { month: "desc" } }),
    prisma.linkedinMetric.findFirst({ where: { clientId }, orderBy: { month: "asc" } }),
    prisma.linkedinMetric.findFirst({ where: { clientId }, orderBy: { month: "desc" } }),
    prisma.ga4Metric.findFirst({ where: { clientId }, orderBy: { month: "desc" } }),
  ]);

  const [igAll, liAll, ga4All] = await Promise.all([
    prisma.instagramMetric.findMany({ where: { clientId }, orderBy: { month: "asc" } }),
    prisma.linkedinMetric.findMany({ where: { clientId }, orderBy: { month: "asc" } }),
    prisma.ga4Metric.findMany({ where: { clientId }, orderBy: { month: "asc" } }),
  ]);

  const igFirst = igAll[0] ?? null;

  const overview = {
    kpis: {
      igSeguidores:  { value: igLast?.seguidores,      growth: pctGrowth(igFirst?.seguidores, igLast?.seguidores) },
      liSeguidores:  { value: liLast?.seguidores,      growth: pctGrowth(liFirst?.seguidores, liLast?.seguidores) },
      totalViewsIG:  { value: igLast?.visualizacoes,   variation: varLast(igAll.map((m) => m.visualizacoes)) },
      usuariosSite:  { value: ga4Last?.usuariosAtivos, variation: varLast(ga4All.map((m) => m.usuariosAtivos)) },
      alcanceIG:     { value: igLast?.alcanceOrganico, variation: varLast(igAll.map((m) => m.alcanceOrganico)) },
      engajamentoLI: { value: liLast?.engajamento,     variation: varLast(liAll.map((m) => m.engajamento)) },
    },
    timeseries: {
      instagram: igAll.map((m) => ({ mes: m.monthLabel, monthKey: m.month, igSeg: m.seguidores, igAlc: m.alcanceOrganico })),
      linkedin:  liAll.map((m) => ({ mes: m.monthLabel.split("/")[0], monthKey: m.month, liSeg: m.seguidores, liAlc: m.alcance })),
      ga4:       ga4All.map((m) => ({ mes: m.monthLabel.split("/")[0], monthKey: m.month, usuarios: m.usuariosAtivos, sessoes: m.sessoes })),
    },
    growth: {
      igTotal: igLast?.novosSeguidores ?? null,
      igPct:   pctGrowth(igAll[igAll.length - 2]?.seguidores, igLast?.seguidores),
      liTotal: liLast && liFirst ? liLast.seguidores - liFirst.seguidores : null,
      liPct:   pctGrowth(liFirst?.seguidores, liLast?.seguidores),
    },
  };
  cacheSet(key, overview);
  return overview;
}

function pctGrowth(first, last) {
  if (first == null || last == null || first === 0) return null;
  return +(((last - first) / first) * 100).toFixed(1);
}

function varLast(arr) {
  const clean = arr.filter((v) => v != null);
  if (clean.length < 2) return null;
  const prev = clean[clean.length - 2];
  const curr = clean[clean.length - 1];
  if (!prev) return null;
  return +(((curr - prev) / prev) * 100).toFixed(1);
}

// ─── AI Insights ──────────────────────────────────────────────────────────────
const STALE_DAYS = 15;

async function getAiInsights(clientId, forceRegenerate = false) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { name: true },
  });

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (!forceRegenerate) {
    const existing = await prisma.aiInsight.findUnique({
      where: { clientId_month: { clientId, month } },
    });
    if (existing) {
      const ageMs = now - new Date(existing.generatedAt);
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays < STALE_DAYS) {
        return { ...existing, cached: true };
      }
    }
  }

  // Fetch last available metric for each platform
  const [ig, li, ga4] = await Promise.all([
    prisma.instagramMetric.findFirst({ where: { clientId }, orderBy: { month: "desc" } }),
    prisma.linkedinMetric.findFirst({ where: { clientId }, orderBy: { month: "desc" } }),
    prisma.ga4Metric.findFirst({ where: { clientId }, orderBy: { month: "desc" } }),
  ]);

  const generated = await generateInsights({
    clientName: client?.name ?? "Cliente",
    ig: ig ?? null,
    li: li ?? null,
    ga4: ga4 ?? null,
  });

  const saved = await prisma.aiInsight.upsert({
    where: { clientId_month: { clientId, month } },
    update: {
      canalPrincipal: generated.canalPrincipal,
      insights: generated.insights,
      generatedAt: now,
    },
    create: {
      clientId,
      month,
      canalPrincipal: generated.canalPrincipal,
      insights: generated.insights,
      generatedAt: now,
    },
  });

  return { ...saved, cached: false };
}

module.exports = { getInstagramMetrics, getLinkedinMetrics, getGa4Metrics, getOverview, getAiInsights, invalidateCache };
