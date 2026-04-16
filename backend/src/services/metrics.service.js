const prisma = require("../config/prisma");

// ─── Instagram ────────────────────────────────────────────────────────────────
async function getInstagramMetrics(clientId) {
  const metrics = await prisma.instagramMetric.findMany({
    where: { clientId },
    orderBy: { month: "asc" },
  });

  const cities = await prisma.city.findMany({
    where: { clientId, platform: "INSTAGRAM" },
    include: { metrics: { orderBy: { month: "asc" } } },
  });

  const themes = await prisma.theme.findMany({
    where: { clientId, platform: "INSTAGRAM" },
    orderBy: { curtidas: "desc" },
  });

  return { metrics, cities, themes };
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────
async function getLinkedinMetrics(clientId) {
  const metrics = await prisma.linkedinMetric.findMany({
    where: { clientId },
    orderBy: { month: "asc" },
  });

  const cities = await prisma.city.findMany({
    where: { clientId, platform: "LINKEDIN" },
    include: { metrics: { orderBy: { month: "asc" } } },
  });

  const themes = await prisma.theme.findMany({
    where: { clientId, platform: "LINKEDIN" },
    orderBy: { engajamento: "desc" },
  });

  const industries = await prisma.linkedinIndustry.findMany({
    where: { clientId },
    orderBy: { seguidores: "desc" },
  });

  const roles = await prisma.linkedinRole.findMany({
    where: { clientId },
    orderBy: { seguidores: "desc" },
  });

  return { metrics, cities, themes, industries, roles };
}

// ─── GA4 ──────────────────────────────────────────────────────────────────────
async function getGa4Metrics(clientId) {
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

  return { metrics, pages, origins };
}

// ─── Overview ─────────────────────────────────────────────────────────────────
// IG now stores period keys (last_15d … last_90d) — use last_30d as canonical for overview
const IG_30D = "last_30d";

async function getOverview(clientId) {
  const [ig30, liFirst, liLast, ga4Last] = await Promise.all([
    prisma.instagramMetric.findUnique({ where: { clientId_month: { clientId, month: IG_30D } } }),
    prisma.linkedinMetric.findFirst({ where: { clientId }, orderBy: { month: "asc" } }),
    prisma.linkedinMetric.findFirst({ where: { clientId }, orderBy: { month: "desc" } }),
    prisma.ga4Metric.findFirst({ where: { clientId }, orderBy: { month: "desc" } }),
  ]);

  // IG timeseries: all 4 period records ordered by days ascending
  const igAll = await prisma.instagramMetric.findMany({
    where: { clientId, month: { in: ["last_15d", "last_30d", "last_60d", "last_90d"] } },
    orderBy: { month: "asc" },
  });

  const liAll  = await prisma.linkedinMetric.findMany({ where: { clientId }, orderBy: { month: "asc" } });
  const ga4All = await prisma.ga4Metric.findMany({ where: { clientId }, orderBy: { month: "asc" } });

  return {
    kpis: {
      igSeguidores:  { value: ig30?.seguidores,       growth: null },
      liSeguidores:  { value: liLast?.seguidores,      growth: pctGrowth(liFirst?.seguidores, liLast?.seguidores) },
      totalViewsIG:  { value: ig30?.visualizacoes,     variation: null },
      usuariosSite:  { value: ga4Last?.usuariosAtivos,  variation: varLast(ga4All.map(m => m.usuariosAtivos)) },
      alcanceIG:     { value: ig30?.alcanceOrganico,   variation: null },
      engajamentoLI: { value: liLast?.engajamento,      variation: varLast(liAll.map(m => m.engajamento)) },
    },
    timeseries: {
      instagram: igAll.map(m => ({ mes: m.monthLabel, monthKey: m.month, igSeg: m.seguidores, igAlc: m.alcanceOrganico })),
      linkedin:  liAll.map(m => ({ mes: m.monthLabel.split("/")[0], monthKey: m.month, liSeg: m.seguidores, liAlc: m.alcance })),
      ga4:       ga4All.map(m => ({ mes: m.monthLabel.split("/")[0], monthKey: m.month, usuarios: m.usuariosAtivos, sessoes: m.sessoes })),
    },
    growth: {
      igTotal: ig30?.novosSeguidores ?? null,
      igPct:   null,
      liTotal: liLast && liFirst ? liLast.seguidores - liFirst.seguidores : null,
      liPct:   pctGrowth(liFirst?.seguidores, liLast?.seguidores),
    },
  };
}

function pctGrowth(first, last) {
  if (!first || !last) return null;
  return +(((last - first) / first) * 100).toFixed(1);
}

function varLast(arr) {
  const clean = arr.filter(v => v != null);
  if (clean.length < 2) return null;
  const prev = clean[clean.length - 2];
  const curr = clean[clean.length - 1];
  if (!prev) return null;
  return +(((curr - prev) / prev) * 100).toFixed(1);
}

module.exports = { getInstagramMetrics, getLinkedinMetrics, getGa4Metrics, getOverview };
