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
async function getOverview(clientId) {
  const [igFirst, igLast, liFirst, liLast, ga4Last, igSum] = await Promise.all([
    prisma.instagramMetric.findFirst({ where: { clientId }, orderBy: { month: "asc" } }),
    prisma.instagramMetric.findFirst({ where: { clientId }, orderBy: { month: "desc" } }),
    prisma.linkedinMetric.findFirst({ where: { clientId }, orderBy: { month: "asc" } }),
    prisma.linkedinMetric.findFirst({ where: { clientId }, orderBy: { month: "desc" } }),
    prisma.ga4Metric.findFirst({ where: { clientId }, orderBy: { month: "desc" } }),
    prisma.instagramMetric.aggregate({ where: { clientId }, _sum: { visualizacoes: true } }),
  ]);

  const igAll  = await prisma.instagramMetric.findMany({ where: { clientId }, orderBy: { month: "asc" } });
  const liAll  = await prisma.linkedinMetric.findMany({ where: { clientId }, orderBy: { month: "asc" } });
  const ga4All = await prisma.ga4Metric.findMany({ where: { clientId }, orderBy: { month: "asc" } });

  return {
    kpis: {
      igSeguidores:  { value: igLast?.seguidores,      growth: pctGrowth(igFirst?.seguidores,      igLast?.seguidores) },
      liSeguidores:  { value: liLast?.seguidores,      growth: pctGrowth(liFirst?.seguidores,      liLast?.seguidores) },
      totalViewsIG:  { value: igSum._sum.visualizacoes, variation: varLast(igAll.map(m => m.visualizacoes)) },
      usuariosSite:  { value: ga4Last?.usuariosAtivos,  variation: varLast(ga4All.map(m => m.usuariosAtivos)) },
      alcanceIG:     { value: igLast?.alcanceOrganico,  variation: varLast(igAll.map(m => m.alcanceOrganico)) },
      engajamentoLI: { value: liLast?.engajamento,      variation: varLast(liAll.map(m => m.engajamento)) },
    },
    timeseries: {
      instagram: igAll.map(m => ({ mes: m.monthLabel.split("/")[0], monthKey: m.month, igSeg: m.seguidores, igAlc: m.alcanceOrganico })),
      linkedin:  liAll.map(m => ({ mes: m.monthLabel.split("/")[0], monthKey: m.month, liSeg: m.seguidores, liAlc: m.alcance })),
      ga4:       ga4All.map(m => ({ mes: m.monthLabel.split("/")[0], monthKey: m.month, usuarios: m.usuariosAtivos, sessoes: m.sessoes })),
    },
    growth: {
      igTotal: igLast && igFirst ? igLast.seguidores - igFirst.seguidores : null,
      igPct:   pctGrowth(igFirst?.seguidores, igLast?.seguidores),
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
