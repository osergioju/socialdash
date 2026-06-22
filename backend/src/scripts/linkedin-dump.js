/**
 * Dump das respostas cruas da API do LinkedIn para diagnóstico.
 *
 * Uso:
 *   node src/scripts/linkedin-dump.js <clientId>
 *
 * Mostra o JSON real de followerStatistics, pageStatistics, shareStatistics e
 * networkSizes — para conferir os nomes de campo (seguidores, impressões, etc.).
 */

const https = require("https");
const prisma = require("../config/prisma");
const { decrypt } = require("../utils/crypto");

function httpGet(url, token, extraHeaders = {}) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    https
      .get(
        {
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          headers: { Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0", ...extraHeaders },
        },
        (res) => {
          let raw = "";
          res.on("data", (c) => { raw += c; });
          res.on("end", () => {
            let body;
            try { body = JSON.parse(raw); } catch { body = { _raw: raw }; }
            resolve({ status: res.statusCode, body });
          });
        }
      )
      .on("error", (e) => resolve({ status: 0, body: { _error: String(e) } }));
  });
}

function show(label, res) {
  console.log("\n" + "═".repeat(70));
  console.log(`▶ ${label}  (HTTP ${res.status})`);
  console.log("═".repeat(70));
  console.log(JSON.stringify(res.body, null, 2));
}

async function main() {
  const clientId = process.argv[2];
  if (!clientId) {
    console.error("Uso: node src/scripts/linkedin-dump.js <clientId>");
    process.exit(1);
  }

  const conn = await prisma.platformConnection.findUnique({
    where: { clientId_platform: { clientId, platform: "LINKEDIN" } },
  });
  if (!conn || !conn.accessToken) {
    console.error("Conexão LinkedIn não encontrada para este cliente.");
    process.exit(1);
  }

  const token = decrypt(conn.accessToken);
  const meta = conn.metadata ? JSON.parse(conn.metadata) : {};
  const orgUrn = meta.organizationUrn;
  console.log("Organização:", meta.organizationName, "→", orgUrn);
  if (!orgUrn) { console.error("Sem organizationUrn no metadata."); process.exit(1); }

  const enc = encodeURIComponent(orgUrn);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

  show(
    "/v2/networkSizes (TOTAL de seguidores)",
    await httpGet(`https://api.linkedin.com/v2/networkSizes/${enc}?edgeType=CompanyFollowedByMember`, token)
  );
  show(
    "organizationalEntityFollowerStatistics (recortes + ganhos)",
    await httpGet(`https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${enc}`, token)
  );
  show(
    "organizationPageStatistics — LIFETIME (sem timeIntervals)",
    await httpGet(`https://api.linkedin.com/v2/organizationPageStatistics?q=organizationalEntity&organizationalEntity=${enc}`, token)
  );
  show(
    "organizationalEntityShareStatistics — LIFETIME (sem timeIntervals)",
    await httpGet(`https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${enc}`, token)
  );

  // ── Sondas para LISTAR POSTS (necessário para o ranking de Temas) ──────────
  show(
    "v2/shares — posts da organização (legado)",
    await httpGet(`https://api.linkedin.com/v2/shares?q=owners&owners=${enc}&sortBy=LAST_MODIFIED&count=10`, token)
  );
  show(
    "rest/posts — posts da organização (API versionada)",
    await httpGet(
      `https://api.linkedin.com/rest/posts?q=author&author=${enc}&count=10&sortBy=LAST_MODIFIED`,
      token,
      { "LinkedIn-Version": "202401" }
    )
  );

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
