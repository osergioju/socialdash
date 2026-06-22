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
    console.error(
      conn
        ? `Conexão LinkedIn existe (status=${conn.status}) mas SEM accessToken — reconecte o LinkedIn.`
        : "Nenhuma conexão LinkedIn para este clientId."
    );
    console.error("\nConexões LinkedIn existentes no banco:");
    const all = await prisma.platformConnection.findMany({
      where: { platform: "LINKEDIN" },
      select: { clientId: true, status: true, accountName: true, accessToken: true, metadata: true },
    });
    for (const c of all) {
      let org = "";
      try { org = c.metadata ? JSON.parse(c.metadata).organizationName : ""; } catch {}
      console.error(`  clientId=${c.clientId} status=${c.status} token=${c.accessToken ? "sim" : "NÃO"} org="${org || c.accountName || "?"}"`);
    }
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
  // owners precisa do formato List(...) no protocolo Rest.li 2.0.0
  show(
    "v2/shares — posts da organização (legado, owners=List)",
    await httpGet(`https://api.linkedin.com/v2/shares?q=owners&owners=List(${enc})&sortBy=LAST_MODIFIED&count=10`, token)
  );
  const postsRes = await httpGet(
    `https://api.linkedin.com/rest/posts?q=author&author=${enc}&count=5&sortBy=LAST_MODIFIED`,
    token,
    { "LinkedIn-Version": "202506" }
  );
  show("rest/posts (LinkedIn-Version: 202506)", postsRes);

  // ── Engajamento POR POST: testar as duas formas ───────────────────────────
  const firstPost = postsRes.body?.elements?.[0];
  if (firstPost) {
    const postUrn = firstPost.id;
    const encPost = encodeURIComponent(postUrn);
    console.log("\n>>> Testando engajamento do post:", postUrn);

    show(
      "A) rest/socialActions/{postUrn} — curtidas + comentários",
      await httpGet(`https://api.linkedin.com/rest/socialActions/${encPost}`, token, { "LinkedIn-Version": "202506" })
    );

    const facet = postUrn.includes(":ugcPost:") ? "ugcPosts" : "shares";
    show(
      `B) organizationalEntityShareStatistics &${facet}=List(...) — stats por post`,
      await httpGet(
        `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${enc}&${facet}=List(${encPost})`,
        token,
        { "LinkedIn-Version": "202506" }
      )
    );
  }

  // ── Resolver NOME de indústria (qual formato funciona?) ────────────────────
  console.log("\n>>> Testando resolução de nome de indústria (id=59):");
  show("C1) v2/industries/59?locale=pt_BR", await httpGet("https://api.linkedin.com/v2/industries/59?locale=pt_BR", token));
  show("C2) rest/industries/59 (Version 202506)", await httpGet("https://api.linkedin.com/rest/industries/59", token, { "LinkedIn-Version": "202506" }));
  show("C3) rest/industryTaxonomyV2/59 (Version 202506)", await httpGet("https://api.linkedin.com/rest/industryTaxonomyV2/59", token, { "LinkedIn-Version": "202506" }));

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
