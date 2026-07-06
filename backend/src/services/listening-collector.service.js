/**
 * Coletor do Social Listening — roda em background (scheduler) ou sob demanda.
 *
 * Fluxo por monitoramento ativo:
 *   1. monta os termos (marca + palavras-chave + hashtags + concorrentes)
 *   2. executa cada fonte habilitada via registry (listening-sources/)
 *   3. salva menções novas (dedupe por sha256 da URL)
 *   4. processa menções sem análise via IA (sentimento, categoria, urgência…)
 */

const crypto = require("crypto");
const prisma = require("../config/prisma");
const { analyzeMentions } = require("./gemini.service");
const { SOURCE_ADAPTERS } = require("./listening-sources");

const AI_BATCH_SIZE = 8;   // menções por prompt
const AI_MAX_PER_RUN = 48; // limite de menções analisadas por execução

function urlHash(url) {
  return crypto.createHash("sha256").update(String(url).trim()).digest("hex");
}

// Monta a lista de termos com o tipo de match correspondente.
function buildTerms(monitoring) {
  const terms = [{ term: monitoring.brand, type: "BRAND" }];
  for (const kw of monitoring.keywords || []) {
    terms.push({ term: kw.term, type: kw.type });
  }
  // dedupe por termo (case-insensitive)
  const seen = new Set();
  return terms.filter(({ term }) => {
    const k = term.toLowerCase();
    if (!term.trim() || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ─── Coleta de um monitoramento ───────────────────────────────────────────────

async function collectMonitoring(monitoringId) {
  const monitoring = await prisma.monitoring.findUnique({
    where: { id: monitoringId },
    include: { keywords: true, sources: { where: { enabled: true } } },
  });
  if (!monitoring) throw Object.assign(new Error("Monitoramento não encontrado"), { status: 404 });

  const terms = buildTerms(monitoring);
  if (terms.length === 0) return { collected: 0, new: 0, analyzed: 0 };

  // Agrupa fontes habilitadas por tipo (RSS pode ter várias linhas — um feed cada)
  const byType = {};
  for (const src of monitoring.sources) {
    if (!byType[src.type]) byType[src.type] = [];
    byType[src.type].push(src);
  }

  let collected = 0;
  let created = 0;

  for (const [type, sourceRows] of Object.entries(byType)) {
    const adapter = SOURCE_ADAPTERS[type];
    if (!adapter) {
      console.warn(`[listening] fonte "${type}" sem adapter registrado — ignorada`);
      continue;
    }
    let mentions = [];
    try {
      mentions = await adapter.collect({ monitoring, terms, sourceRows });
    } catch (err) {
      console.error(`[listening] fonte ${type} falhou (monitoring=${monitoringId}):`, err.message);
      continue;
    }
    collected += mentions.length;

    // Ignora menções anteriores à data inicial do monitoramento
    const startDate = monitoring.startDate ? new Date(monitoring.startDate) : null;

    const rows = [];
    const seenHashes = new Set();
    for (const m of mentions) {
      if (!m.url) continue;
      if (startDate && m.publishedAt && new Date(m.publishedAt) < startDate) continue;
      const hash = urlHash(m.url);
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);
      rows.push({
        monitoringId,
        sourceType: m.sourceType,
        urlHash: hash,
        url: String(m.url).slice(0, 2000),
        title: m.title ? String(m.title).slice(0, 500) : null,
        text: m.text ? String(m.text).slice(0, 5000) : null,
        author: m.author ? String(m.author).slice(0, 200) : null,
        sourceName: m.sourceName ? String(m.sourceName).slice(0, 200) : null,
        language: m.language || null,
        imageUrl: m.imageUrl ? String(m.imageUrl).slice(0, 2000) : null,
        publishedAt: m.publishedAt ? new Date(m.publishedAt) : null,
        collectedAt: new Date(),
        matchedKeyword:    m.matchedTermType === "KEYWORD" || m.matchedTermType === "HASHTAG" ? m.matchedTerm : null,
        matchedBrand:      m.matchedTermType === "BRAND" ? m.matchedTerm : null,
        matchedCompetitor: m.matchedTermType === "COMPETITOR" ? m.matchedTerm : null,
      });
    }

    if (rows.length) {
      const res = await prisma.mention.createMany({ data: rows, skipDuplicates: true });
      created += res.count;
    }

    await prisma.listeningSource.updateMany({
      where: { id: { in: sourceRows.map((s) => s.id) } },
      data: { lastCollectedAt: new Date() },
    });
  }

  await prisma.monitoring.update({
    where: { id: monitoringId },
    data: { lastCollectedAt: new Date() },
  });

  // ── Processamento IA das menções pendentes ─────────────────────────────────
  const analyzed = await processUnanalyzedMentions(monitoringId).catch((err) => {
    console.error(`[listening] análise IA falhou (monitoring=${monitoringId}):`, err.message);
    return 0;
  });

  console.log(`[listening] ${monitoring.name}: coletadas=${collected} novas=${created} analisadas=${analyzed}`);
  return { collected, new: created, analyzed };
}

// ─── Análise IA em lotes ──────────────────────────────────────────────────────

async function processUnanalyzedMentions(monitoringId) {
  const monitoring = await prisma.monitoring.findUnique({
    where: { id: monitoringId },
    include: { keywords: { where: { type: "COMPETITOR" } } },
  });
  if (!monitoring) return 0;

  const pending = await prisma.mention.findMany({
    where: { monitoringId, sentiment: null },
    orderBy: { collectedAt: "desc" },
    take: AI_MAX_PER_RUN,
  });
  if (pending.length === 0) return 0;

  const competitors = monitoring.keywords.map((k) => k.term);
  let analyzed = 0;

  for (let i = 0; i < pending.length; i += AI_BATCH_SIZE) {
    const batch = pending.slice(i, i + AI_BATCH_SIZE);
    try {
      const result = await analyzeMentions({
        brand: monitoring.brand,
        competitors,
        mentions: batch.map((m, idx) => ({
          index: idx + 1,
          title: m.title,
          text: m.text,
          sourceType: m.sourceType,
          sourceName: m.sourceName,
        })),
      });

      for (const a of result.analyses || []) {
        const mention = batch[a.index - 1];
        if (!mention) continue;
        const sentiment = ["POSITIVE", "NEGATIVE", "NEUTRAL"].includes(a.sentiment) ? a.sentiment : "NEUTRAL";
        await prisma.mentionSentiment.upsert({
          where: { mentionId: mention.id },
          update: {},
          create: {
            mentionId: mention.id,
            sentiment,
            score: typeof a.score === "number" ? Math.max(-1, Math.min(1, a.score)) : 0,
            summary: a.summary || null,
            category: a.category || null,
            theme: a.theme || null,
            urgency: a.urgency || null,
            intent: a.intent || null,
            entities: Array.isArray(a.entities) ? a.entities : [],
            suggestedReply: a.suggestedReply || null,
          },
        });
        // Resumo da menção também fica na própria mention (consulta rápida)
        if (a.summary) {
          await prisma.mention.update({ where: { id: mention.id }, data: { summary: a.summary } });
        }
        analyzed++;
      }
    } catch (err) {
      console.error(`[listening] lote IA falhou (monitoring=${monitoringId}):`, err.message);
    }
  }
  return analyzed;
}

// ─── Execução para todos os monitoramentos ativos (scheduler) ─────────────────

async function runListeningCollection() {
  const monitorings = await prisma.monitoring.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
  });
  if (monitorings.length === 0) return;

  console.log(`[listening] Coleta iniciada para ${monitorings.length} monitoramento(s)…`);
  for (const m of monitorings) {
    try {
      await collectMonitoring(m.id);
    } catch (err) {
      console.error(`[listening] ${m.name} falhou:`, err.message);
    }
  }
  console.log("[listening] Coleta concluída.");
}

module.exports = { collectMonitoring, processUnanalyzedMentions, runListeningCollection };
