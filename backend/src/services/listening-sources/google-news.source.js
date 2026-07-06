/**
 * Fonte: Google News (RSS de busca) — cobre sites de notícias e blogs indexados.
 * Não requer chave de API.
 */

const { fetchText, parseFeedItems } = require("./http.util");

const TYPE = "GOOGLE_NEWS";

// term → menções normalizadas
async function collect({ monitoring, terms }) {
  const lang = monitoring.language || "pt";
  const country = (monitoring.country || "BR").toUpperCase();
  const hl = lang === "pt" ? "pt-BR" : lang;
  const ceid = `${country}:${lang === "pt" ? "pt-419" : lang}`;

  const mentions = [];
  for (const { term, type } of terms) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`"${term}"`)}&hl=${hl}&gl=${country}&ceid=${encodeURIComponent(ceid)}`;
      const xml = await fetchText(url);
      for (const item of parseFeedItems(xml).slice(0, 30)) {
        mentions.push({
          sourceType: TYPE,
          url: item.url,
          title: item.title,
          text: item.text,
          author: item.author,
          sourceName: item.sourceName,
          language: lang,
          imageUrl: item.imageUrl,
          publishedAt: item.publishedAt,
          matchedTerm: term,
          matchedTermType: type,
        });
      }
    } catch (err) {
      console.warn(`[listening/google-news] termo "${term}" falhou:`, err.message);
    }
  }
  return mentions;
}

module.exports = { TYPE, collect };
