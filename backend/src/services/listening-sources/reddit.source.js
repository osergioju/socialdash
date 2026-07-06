/**
 * Fonte: Reddit (busca pública via RSS — o endpoint JSON bloqueia bots com 403).
 * Não requer chave de API.
 */

const { fetchText, parseFeedItems } = require("./http.util");

const TYPE = "REDDIT";

// Reddit exige User-Agent de navegador para o feed público.
const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

async function collect({ monitoring, terms }) {
  const mentions = [];
  for (const { term, type } of terms) {
    try {
      const url = `https://www.reddit.com/search.rss?q=${encodeURIComponent(`"${term}"`)}&sort=new&limit=25`;
      const xml = await fetchText(url, 3, { "User-Agent": BROWSER_UA });
      for (const item of parseFeedItems(xml).slice(0, 25)) {
        // A busca do Reddit é fuzzy — mantém só resultados que citam o termo.
        const haystack = `${item.title || ""} ${item.text || ""}`.toLowerCase();
        if (!haystack.includes(term.toLowerCase())) continue;
        // subreddit vem no path da URL: /r/<sub>/comments/...
        const subreddit = (item.url.match(/\/r\/([^/]+)\//) || [])[1];
        mentions.push({
          sourceType: TYPE,
          url: item.url,
          title: item.title,
          text: item.text ? item.text.slice(0, 2000) : null,
          author: item.author,
          sourceName: subreddit ? `r/${subreddit}` : "Reddit",
          language: monitoring.language || null,
          imageUrl: item.imageUrl,
          publishedAt: item.publishedAt,
          matchedTerm: term,
          matchedTermType: type,
        });
      }
    } catch (err) {
      console.warn(`[listening/reddit] termo "${term}" falhou:`, err.message);
    }
  }
  return mentions;
}

module.exports = { TYPE, collect };
