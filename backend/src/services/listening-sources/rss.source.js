/**
 * Fonte: RSS genérico — feeds cadastrados pelo usuário (sites de notícias,
 * blogs etc.). Config esperada em ListeningSource.config: { feedUrl }.
 * Só retorna itens que contenham algum dos termos monitorados.
 */

const { fetchText, parseFeedItems } = require("./http.util");

const TYPE = "RSS";

async function collect({ monitoring, terms, sourceRows = [] }) {
  const feeds = sourceRows
    .map((s) => ({ feedUrl: s.config?.feedUrl, name: s.name }))
    .filter((f) => !!f.feedUrl);
  if (feeds.length === 0) return [];

  const mentions = [];
  for (const feed of feeds) {
    try {
      const xml = await fetchText(feed.feedUrl);
      for (const item of parseFeedItems(xml).slice(0, 50)) {
        const haystack = `${item.title || ""} ${item.text || ""}`.toLowerCase();
        const match = terms.find(({ term }) => haystack.includes(term.toLowerCase()));
        if (!match) continue;
        mentions.push({
          sourceType: TYPE,
          url: item.url,
          title: item.title,
          text: item.text,
          author: item.author,
          sourceName: item.sourceName || feed.name || new URL(feed.feedUrl).hostname,
          language: monitoring.language || null,
          imageUrl: item.imageUrl,
          publishedAt: item.publishedAt,
          matchedTerm: match.term,
          matchedTermType: match.type,
        });
      }
    } catch (err) {
      console.warn(`[listening/rss] feed "${feed.feedUrl}" falhou:`, err.message);
    }
  }
  return mentions;
}

module.exports = { TYPE, collect };
