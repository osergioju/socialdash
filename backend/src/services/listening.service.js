/**
 * Social Listening service — monitoramentos, menções, dashboard e resumo
 * executivo por IA. A coleta em si fica no listening-collector.service.
 */

const prisma = require("../config/prisma");
const { assertClientAccess } = require("../utils/teamAccess");
const { generateListeningSummary } = require("./gemini.service");
const { DEFAULT_SOURCE_TYPES } = require("./listening-sources");

const KEYWORD_TYPES = ["KEYWORD", "HASHTAG", "COMPETITOR"];

function notFound(msg = "Monitoramento não encontrado") {
  return Object.assign(new Error(msg), { status: 404 });
}

async function getMonitoringScoped(id, user, include = {}) {
  const monitoring = await prisma.monitoring.findUnique({
    where: { id },
    include: { keywords: true, sources: true, ...include },
  });
  if (!monitoring) throw notFound();
  await assertClientAccess(user, monitoring.clientId);
  return monitoring;
}

// Converte arrays simples (keywords/hashtags/competitors) em linhas keywords.
function keywordRows(data) {
  const rows = [];
  for (const term of data.keywords || [])    rows.push({ term, type: "KEYWORD" });
  for (const term of data.hashtags || [])    rows.push({ term: term.startsWith("#") ? term : `#${term}`, type: "HASHTAG" });
  for (const term of data.competitors || []) rows.push({ term, type: "COMPETITOR" });
  const seen = new Set();
  return rows.filter((r) => {
    const k = `${r.type}:${r.term.toLowerCase()}`;
    if (!r.term.trim() || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function serializeMonitoring(m) {
  const kw = m.keywords || [];
  return {
    ...m,
    keywords:    kw.filter((k) => k.type === "KEYWORD").map((k) => k.term),
    hashtags:    kw.filter((k) => k.type === "HASHTAG").map((k) => k.term),
    competitors: kw.filter((k) => k.type === "COMPETITOR").map((k) => k.term),
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

async function listMonitorings(clientId, user) {
  await assertClientAccess(user, clientId);
  const monitorings = await prisma.monitoring.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: {
      keywords: true,
      sources: { select: { id: true, type: true, name: true, enabled: true, lastCollectedAt: true } },
      _count: { select: { mentions: true } },
    },
  });
  return monitorings.map(serializeMonitoring);
}

async function getMonitoring(id, user) {
  const monitoring = await getMonitoringScoped(id, user, {
    _count: { select: { mentions: true } },
  });
  return serializeMonitoring(monitoring);
}

async function createMonitoring(clientId, data, user) {
  await assertClientAccess(user, clientId);
  const monitoring = await prisma.monitoring.create({
    data: {
      clientId,
      name:      data.name,
      brand:     data.brand,
      language:  data.language || "pt",
      country:   data.country || "BR",
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      status:    data.status || "ACTIVE",
      keywords:  { create: keywordRows(data) },
      // Fontes padrão habilitadas; RSS entra depois via setSources com feedUrl
      sources:   { create: DEFAULT_SOURCE_TYPES.map((type) => ({ type, name: type })) },
    },
    include: { keywords: true, sources: true },
  });
  return serializeMonitoring(monitoring);
}

async function updateMonitoring(id, data, user) {
  const existing = await getMonitoringScoped(id, user);

  const ops = [
    prisma.monitoring.update({
      where: { id },
      data: {
        name:      data.name      ?? existing.name,
        brand:     data.brand     ?? existing.brand,
        language:  data.language  ?? existing.language,
        country:   data.country   ?? existing.country,
        startDate: data.startDate ? new Date(data.startDate) : existing.startDate,
        status:    data.status    ?? existing.status,
      },
    }),
  ];

  // Se algum grupo de termos foi enviado, substitui os termos desse(s) tipo(s)
  const groups = { keywords: "KEYWORD", hashtags: "HASHTAG", competitors: "COMPETITOR" };
  const touchedTypes = Object.entries(groups).filter(([field]) => data[field] !== undefined).map(([, t]) => t);
  if (touchedTypes.length) {
    ops.push(prisma.monitoringKeyword.deleteMany({ where: { monitoringId: id, type: { in: touchedTypes } } }));
    const rows = keywordRows(data).filter((r) => touchedTypes.includes(r.type));
    if (rows.length) {
      ops.push(prisma.monitoringKeyword.createMany({
        data: rows.map((r) => ({ ...r, monitoringId: id })),
        skipDuplicates: true,
      }));
    }
  }

  await prisma.$transaction(ops);
  return getMonitoring(id, user);
}

async function deleteMonitoring(id, user) {
  await getMonitoringScoped(id, user);
  await prisma.monitoring.delete({ where: { id } });
}

// ─── Fontes ───────────────────────────────────────────────────────────────────

// sources: [{ id?, type, name?, config?, enabled? }] — substitui o conjunto.
async function setSources(id, sources, user) {
  await getMonitoringScoped(id, user);
  await prisma.$transaction([
    prisma.listeningSource.deleteMany({ where: { monitoringId: id } }),
    prisma.listeningSource.createMany({
      data: sources.map((s) => ({
        monitoringId: id,
        type:    s.type,
        name:    s.name || s.type,
        config:  s.config || undefined,
        enabled: s.enabled !== false,
      })),
    }),
  ]);
  return prisma.listeningSource.findMany({ where: { monitoringId: id } });
}

// ─── Menções ──────────────────────────────────────────────────────────────────

async function listMentions(id, user, { sentiment, sourceType, urgency, q, page = 1, pageSize = 20 } = {}) {
  await getMonitoringScoped(id, user);

  const where = {
    monitoringId: id,
    ...(sourceType ? { sourceType } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { text:  { contains: q, mode: "insensitive" } },
      ],
    } : {}),
    ...(sentiment || urgency ? {
      sentiment: {
        ...(sentiment ? { sentiment } : {}),
        ...(urgency ? { urgency } : {}),
      },
    } : {}),
  };

  const [total, mentions] = await Promise.all([
    prisma.mention.count({ where }),
    prisma.mention.findMany({
      where,
      include: { sentiment: true },
      orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { collectedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { total, page, pageSize, mentions };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

const STOPWORDS = new Set(("a o e é de da do das dos em no na nos nas um uma uns umas para por com sem sob sobre entre até após " +
  "que se não sim mais menos muito pouco como quando onde quem qual quais isso isto aquilo ele ela eles elas você vocês nós " +
  "ao aos à às pelo pela pelos pelas num numa dum duma foi ser são está estão era eram tem têm ter há sua seu suas seus nosso nossa " +
  "já ainda também só apenas mas ou nem porque pois então assim depois antes agora hoje ontem amanhã the of and to in is a an for on " +
  "with at by from it this that was are be as or has have had not but they their its").split(/\s+/));

function topWords(texts, limit = 30) {
  const counts = {};
  for (const text of texts) {
    const words = String(text || "").toLowerCase()
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/[^\p{L}\p{N}#\s]/gu, " ")
      .split(/\s+/);
    for (const w of words) {
      if (w.length < 4 || w.startsWith("#") || STOPWORDS.has(w)) continue;
      counts[w] = (counts[w] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

function topHashtags(texts, limit = 20) {
  const counts = {};
  for (const text of texts) {
    for (const tag of String(text || "").toLowerCase().match(/#[\p{L}\p{N}_]+/gu) || []) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

async function getDashboard(id, user, { days = 30 } = {}) {
  const monitoring = await getMonitoringScoped(id, user);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const mentions = await prisma.mention.findMany({
    where: {
      monitoringId: id,
      OR: [{ publishedAt: { gte: since } }, { publishedAt: null, collectedAt: { gte: since } }],
    },
    include: { sentiment: true },
    orderBy: { publishedAt: "desc" },
  });

  const analyzed = mentions.filter((m) => m.sentiment);
  const positive = analyzed.filter((m) => m.sentiment.sentiment === "POSITIVE").length;
  const negative = analyzed.filter((m) => m.sentiment.sentiment === "NEGATIVE").length;
  const neutral  = analyzed.filter((m) => m.sentiment.sentiment === "NEUTRAL").length;
  const avgScore = analyzed.length
    ? +(analyzed.reduce((s, m) => s + (m.sentiment.score || 0), 0) / analyzed.length).toFixed(2)
    : 0;

  // Menções por dia
  const byDayMap = {};
  for (const m of mentions) {
    const day = (m.publishedAt || m.collectedAt).toISOString().slice(0, 10);
    if (!byDayMap[day]) byDayMap[day] = { date: day, total: 0, positive: 0, negative: 0, neutral: 0 };
    byDayMap[day].total++;
    const s = m.sentiment?.sentiment;
    if (s === "POSITIVE") byDayMap[day].positive++;
    else if (s === "NEGATIVE") byDayMap[day].negative++;
    else if (s === "NEUTRAL") byDayMap[day].neutral++;
  }

  // Por fonte
  const bySourceMap = {};
  for (const m of mentions) {
    bySourceMap[m.sourceType] = (bySourceMap[m.sourceType] || 0) + 1;
  }

  // Por categoria e temas (da análise IA)
  const byCategoryMap = {};
  const themeCounts = {};
  for (const m of analyzed) {
    const cat = m.sentiment.category || "Sem categoria";
    byCategoryMap[cat] = (byCategoryMap[cat] || 0) + 1;
    if (m.sentiment.theme) themeCounts[m.sentiment.theme] = (themeCounts[m.sentiment.theme] || 0) + 1;
  }

  const texts = mentions.map((m) => `${m.title || ""} ${m.text || ""}`);

  return {
    monitoring: serializeMonitoring(monitoring),
    periodDays: days,
    kpis: {
      totalMentions: mentions.length,
      analyzed: analyzed.length,
      positive, negative, neutral,
      avgScore,
      negativeRate: analyzed.length ? +((negative / analyzed.length) * 100).toFixed(1) : 0,
    },
    mentionsPerDay: Object.values(byDayMap).sort((a, b) => a.date.localeCompare(b.date)),
    bySource: Object.entries(bySourceMap).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
    byCategory: Object.entries(byCategoryMap).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
    topThemes: Object.entries(themeCounts).map(([theme, count]) => ({ theme, count })).sort((a, b) => b.count - a.count).slice(0, 15),
    topWords: topWords(texts),
    topHashtags: topHashtags(texts),
    latestMentions: mentions.slice(0, 10).map((m) => ({
      id: m.id, title: m.title, url: m.url, sourceType: m.sourceType, sourceName: m.sourceName,
      publishedAt: m.publishedAt, sentiment: m.sentiment?.sentiment || null, summary: m.summary,
    })),
  };
}

// ─── Resumo executivo (IA) ────────────────────────────────────────────────────

function isoWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

async function getExecutiveSummary(id, user, { period = "weekly", force = false } = {}) {
  const monitoring = await getMonitoringScoped(id, user);

  const now = new Date();
  const periodKey = period === "monthly"
    ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    : isoWeekKey(now);

  if (!force) {
    const existing = await prisma.listeningAiReport.findUnique({
      where: { monitoringId_period_periodKey: { monitoringId: id, period, periodKey } },
    });
    if (existing) return { ...existing, cached: true };
  }

  const days = period === "monthly" ? 30 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const mentions = await prisma.mention.findMany({
    where: {
      monitoringId: id,
      OR: [{ publishedAt: { gte: since } }, { publishedAt: null, collectedAt: { gte: since } }],
    },
    include: { sentiment: true },
    orderBy: { publishedAt: "desc" },
    take: 200,
  });

  const analyzed = mentions.filter((m) => m.sentiment);
  const themeCounts = {};
  const bySource = {};
  for (const m of analyzed) {
    if (m.sentiment.theme) themeCounts[m.sentiment.theme] = (themeCounts[m.sentiment.theme] || 0) + 1;
  }
  for (const m of mentions) bySource[m.sourceType] = (bySource[m.sourceType] || 0) + 1;

  const stats = {
    total: mentions.length,
    positive: analyzed.filter((m) => m.sentiment.sentiment === "POSITIVE").length,
    negative: analyzed.filter((m) => m.sentiment.sentiment === "NEGATIVE").length,
    neutral:  analyzed.filter((m) => m.sentiment.sentiment === "NEUTRAL").length,
    avgScore: analyzed.length
      ? +(analyzed.reduce((s, m) => s + (m.sentiment.score || 0), 0) / analyzed.length).toFixed(2)
      : 0,
    bySource,
    topThemes: Object.entries(themeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t),
  };

  const report = await generateListeningSummary({
    monitoring: { name: monitoring.name, brand: monitoring.brand },
    stats,
    sampleMentions: mentions.slice(0, 25).map((m) => ({
      sourceType: m.sourceType,
      sentiment: m.sentiment?.sentiment,
      title: m.title,
      summary: m.sentiment?.summary,
      text: m.text,
    })),
    periodLabel: period === "monthly" ? `mensal (${periodKey})` : `semanal (${periodKey})`,
  });

  const saved = await prisma.listeningAiReport.upsert({
    where: { monitoringId_period_periodKey: { monitoringId: id, period, periodKey } },
    update: { report, generatedAt: new Date() },
    create: { monitoringId: id, period, periodKey, report, generatedAt: new Date() },
  });
  return { ...saved, cached: false };
}

// ─── Alertas (estrutura pronta; sem notificações por enquanto) ────────────────

async function listAlertRules(id, user) {
  await getMonitoringScoped(id, user);
  return prisma.listeningAlertRule.findMany({ where: { monitoringId: id } });
}

async function setAlertRules(id, rules, user) {
  await getMonitoringScoped(id, user);
  await prisma.$transaction([
    prisma.listeningAlertRule.deleteMany({ where: { monitoringId: id } }),
    ...(rules.length ? [prisma.listeningAlertRule.createMany({
      data: rules.map((r) => ({
        monitoringId: id,
        type:    r.type,
        config:  r.config || undefined,
        enabled: r.enabled === true,
      })),
    })] : []),
  ]);
  return prisma.listeningAlertRule.findMany({ where: { monitoringId: id } });
}

module.exports = {
  listMonitorings, getMonitoring, createMonitoring, updateMonitoring, deleteMonitoring,
  setSources, listMentions, getDashboard, getExecutiveSummary,
  listAlertRules, setAlertRules,
  getMonitoringScoped,
};
