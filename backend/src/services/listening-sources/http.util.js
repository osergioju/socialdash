/**
 * HTTP helpers para os adapters de fontes do Social Listening.
 * Sem dependências externas (mesmo padrão do sync.service).
 */

const https = require("https");

const USER_AGENT = "SocialDashBot/1.0 (social listening; +https://social.agenciacrt.com.br)";

// GET simples com follow de redirect (máx 3) — retorna corpo como string.
function fetchText(url, redirects = 3, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: { "User-Agent": USER_AGENT, "Accept": "*/*", ...headers },
    };
    https.get(opts, (res) => {
      if (res.statusCode >= 301 && res.statusCode <= 308 && res.headers.location && redirects > 0) {
        const next = new URL(res.headers.location, url).toString();
        res.resume();
        return resolve(fetchText(next, redirects - 1, headers));
      }
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode} em ${parsed.hostname}`));
        resolve(raw);
      });
    }).on("error", reject);
  });
}

async function fetchJson(url, headers = {}) {
  const raw = await fetchText(url, 3, headers);
  return JSON.parse(raw);
}

// ─── Parser RSS/Atom minimalista (regex, sem deps) ────────────────────────────

function stripTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) return null;
  return decodeXml(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim());
}

function stripAttr(xml, tag, attr) {
  const m = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i"));
  return m ? decodeXml(m[1]) : null;
}

function decodeXml(s) {
  return String(s)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&amp;/g, "&");
}

function stripHtml(s) {
  return String(s || "")
    .replace(/<[^>]*>/g, " ")
    // Entidades residuais de conteúdo duplamente escapado (ex: &amp;nbsp;)
    .replace(/&#\d+;/g, " ")
    .replace(/&[a-zA-Z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Retorna itens normalizados de um feed RSS 2.0 ou Atom.
function parseFeedItems(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const block of blocks) {
    const title = stripTag(block, "title");
    const link  = stripTag(block, "link") || stripAttr(block, "link", "href");
    const description = stripHtml(stripTag(block, "description") || stripTag(block, "summary") || stripTag(block, "content") || "");
    const pubDate = stripTag(block, "pubDate") || stripTag(block, "published") || stripTag(block, "updated") || stripTag(block, "dc:date");
    const author  = stripTag(block, "author") || stripTag(block, "dc:creator") || null;
    const source  = stripTag(block, "source") || null;
    const imageUrl = stripAttr(block, "media:content", "url") || stripAttr(block, "media:thumbnail", "url") || stripAttr(block, "enclosure", "url") || null;
    if (!link) continue;
    items.push({
      title: title || null,
      url: link,
      text: description || null,
      author: typeof author === "string" ? stripHtml(author) : null,
      sourceName: source,
      publishedAt: pubDate ? new Date(pubDate) : null,
      imageUrl,
    });
  }
  return items;
}

module.exports = { fetchText, fetchJson, parseFeedItems, stripHtml };
