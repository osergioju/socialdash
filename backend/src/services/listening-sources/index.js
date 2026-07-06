/**
 * Registry de fontes do Social Listening.
 *
 * Para adicionar uma nova fonte (Instagram, Facebook, TikTok, X, Threads,
 * LinkedIn…): criar `<nome>.source.js` exportando { TYPE, collect } e
 * registrá-la aqui. Nenhuma outra mudança estrutural é necessária —
 * o coletor itera este registry.
 *
 * Contrato do adapter:
 *   collect({ monitoring, terms, sourceRows }) → [{
 *     sourceType, url, title, text, author, sourceName, language,
 *     imageUrl, publishedAt, matchedTerm, matchedTermType
 *   }]
 */

const googleNews = require("./google-news.source");
const reddit     = require("./reddit.source");
const youtube    = require("./youtube.source");
const rss        = require("./rss.source");

const SOURCE_ADAPTERS = {
  [googleNews.TYPE]: googleNews,
  [reddit.TYPE]:     reddit,
  [youtube.TYPE]:    youtube,
  [rss.TYPE]:        rss,
};

// Fontes criadas por padrão em todo novo monitoramento (RSS é adicionado
// manualmente pelo usuário com a URL do feed).
const DEFAULT_SOURCE_TYPES = [googleNews.TYPE, reddit.TYPE, youtube.TYPE];

module.exports = { SOURCE_ADAPTERS, DEFAULT_SOURCE_TYPES };
