/**
 * Fonte: YouTube (Data API v3 — busca de vídeos).
 * Requer YOUTUBE_API_KEY no .env; sem a chave, a fonte é ignorada silenciosamente.
 */

const { fetchJson } = require("./http.util");

const TYPE = "YOUTUBE";

async function collect({ monitoring, terms }) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    console.log("[listening/youtube] YOUTUBE_API_KEY não configurada — fonte ignorada");
    return [];
  }

  const lang = monitoring.language || "pt";
  const mentions = [];
  for (const { term, type } of terms) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=date&maxResults=25` +
        `&q=${encodeURIComponent(term)}&relevanceLanguage=${lang}&key=${key}`;
      const res = await fetchJson(url);
      for (const item of res?.items || []) {
        const id = item.id?.videoId;
        const s = item.snippet || {};
        if (!id) continue;
        mentions.push({
          sourceType: TYPE,
          url: `https://www.youtube.com/watch?v=${id}`,
          title: s.title || null,
          text: s.description || null,
          author: s.channelTitle || null,
          sourceName: s.channelTitle || "YouTube",
          language: lang,
          imageUrl: s.thumbnails?.medium?.url || s.thumbnails?.default?.url || null,
          publishedAt: s.publishedAt ? new Date(s.publishedAt) : null,
          matchedTerm: term,
          matchedTermType: type,
        });
      }
    } catch (err) {
      console.warn(`[listening/youtube] termo "${term}" falhou:`, err.message);
    }
  }
  return mentions;
}

module.exports = { TYPE, collect };
