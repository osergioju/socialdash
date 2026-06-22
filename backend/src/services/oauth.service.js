/**
 * OAuth 2.0 flows for Meta (Instagram/Facebook), Google Analytics (GA4), LinkedIn.
 *
 * Flow:
 *  1. buildAuthUrl(platform, clientId, userId) → redirect URL
 *  2. handleCallback(platform, code, stateJwt) → stores encrypted token in DB
 */

const jwt = require("jsonwebtoken");
const https = require("https");
const prisma = require("../config/prisma");
const { encrypt, decrypt } = require("../utils/crypto");

// ─── State JWT (short-lived, CSRF protection) ─────────────────────────────────
const STATE_SECRET = () => process.env.JWT_SECRET + "_oauth_state";
const STATE_EXPIRES = "10m";

function signState(payload) {
  return jwt.sign(payload, STATE_SECRET(), { expiresIn: STATE_EXPIRES });
}
function verifyState(token) {
  return jwt.verify(token, STATE_SECRET());
}

// ─── Config per platform ──────────────────────────────────────────────────────
const PLATFORM_CONFIG = {
  META: {
    authUrl: "https://www.facebook.com/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scopes: "pages_show_list,instagram_basic,instagram_manage_insights,instagram_manage_comments,pages_read_engagement,business_management",
    clientId: () => process.env.META_APP_ID,
    secret: () => process.env.META_APP_SECRET,
    redirectPath: "/oauth/meta/callback",
  },
  GOOGLE_ANALYTICS: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/userinfo.email",
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    secret: () => process.env.GOOGLE_CLIENT_SECRET,
    redirectPath: "/oauth/google/callback",
  },
  LINKEDIN: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    // App com Community Management API NÃO usa openid/profile/email — usa r_basicprofile
    // para identificar o usuário, e os r_organization_* para métricas de página.
    // LinkedIn rejeita o fluxo se algum escopo pedido não estiver autorizado no app;
    // os escopos abaixo são os listados na aba Auth do app (CRT Devs / SocialDash).
    scopes: () =>
      process.env.LINKEDIN_SCOPES ||
      "r_basicprofile r_organization_social rw_organization_admin r_organization_followers r_member_postAnalytics",
    clientId: () => process.env.LINKEDIN_CLIENT_ID,
    secret: () => process.env.LINKEDIN_CLIENT_SECRET,
    redirectPath: "/oauth/linkedin/callback",
  },
};

function callbackUrl(platform) {
  const raw = (process.env.BACKEND_URL || "http://localhost:3001").replace(/\/$/, "");
  // Routes are mounted at /api/oauth — ensure /api is present
  const base = raw.endsWith("/api") ? raw : `${raw}/api`;
  return base + PLATFORM_CONFIG[platform].redirectPath;
}

// ─── Build authorization URL ──────────────────────────────────────────────────
function buildAuthUrl(platform, clientId, userId) {
  const cfg = PLATFORM_CONFIG[platform];
  if (!cfg) throw new Error(`Unknown platform: ${platform}`);

  const appClientId = cfg.clientId();
  if (!appClientId) throw Object.assign(new Error(`${platform} app not configured — set env vars`), { status: 400 });

  const state = signState({ platform, clientId, userId });

  const params = new URLSearchParams({
    client_id: appClientId,
    redirect_uri: callbackUrl(platform),
    response_type: "code",
    state,
    scope: typeof cfg.scopes === "function" ? cfg.scopes() : cfg.scopes,
  });

  // Google extras
  if (platform === "GOOGLE_ANALYTICS") {
    params.set("access_type", "offline");
    params.set("prompt", "consent");
  }

  // Meta: force account chooser so different clients can connect different accounts
  if (platform === "META") {
    params.set("auth_type", "reauthenticate");
  }

  return `${cfg.authUrl}?${params.toString()}`;
}

// ─── Exchange code → token ─────────────────────────────────────────────────────
function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(body).toString();
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(data),
      },
    };
    const req = https.request(opts, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch { resolve(raw); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function httpGet(url, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: { Authorization: `Bearer ${token}` },
    };
    https.get(opts, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch { resolve(raw); }
      });
    }).on("error", reject);
  });
}

// ─── Fetch account info after token exchange ───────────────────────────────────
async function fetchAccountInfo(platform, accessToken) {
  try {
    if (platform === "META") {
      const me = await httpGet("https://graph.facebook.com/v19.0/me?fields=id,name,email", accessToken);
      return { accountId: me.id, accountName: me.name, accountEmail: me.email };
    }
    if (platform === "GOOGLE_ANALYTICS") {
      const me = await httpGet("https://www.googleapis.com/oauth2/v2/userinfo", accessToken);
      return { accountId: me.id, accountName: me.name, accountEmail: me.email };
    }
    if (platform === "LINKEDIN") {
      // App com Community Management API usa r_basicprofile → endpoint /v2/me.
      // Fallback para /v2/userinfo (OpenID Connect) caso o app use scopes openid+profile+email.
      const me = await httpGet("https://api.linkedin.com/v2/me", accessToken).catch(() => null);
      if (me && me.id) {
        const name = `${me.localizedFirstName || ""} ${me.localizedLastName || ""}`.trim();
        return { accountId: me.id, accountName: name || null, accountEmail: null };
      }
      const oidc = await httpGet("https://api.linkedin.com/v2/userinfo", accessToken).catch(() => ({}));
      const name = oidc.name || `${oidc.given_name || ""} ${oidc.family_name || ""}`.trim();
      return { accountId: oidc.sub, accountName: name || null, accountEmail: oidc.email || null };
    }
  } catch {
    return {};
  }
  return {};
}

// ─── Handle callback ───────────────────────────────────────────────────────────
async function handleCallback(platform, code, stateToken) {
  // 1. Verify state
  let statePayload;
  try {
    statePayload = verifyState(stateToken);
  } catch {
    throw Object.assign(new Error("State inválido ou expirado"), { status: 400 });
  }

  if (statePayload.platform !== platform) {
    throw Object.assign(new Error("Platform mismatch no state"), { status: 400 });
  }

  const { clientId } = statePayload;
  const cfg = PLATFORM_CONFIG[platform];

  // 2. Exchange code for token
  const tokenRes = await httpPost(cfg.tokenUrl, {
    grant_type: "authorization_code",
    code,
    redirect_uri: callbackUrl(platform),
    client_id: cfg.clientId(),
    client_secret: cfg.secret(),
  });

  if (tokenRes.error) {
    throw Object.assign(new Error(tokenRes.error_description || tokenRes.error), { status: 400 });
  }

  let accessToken = tokenRes.access_token;
  const refreshToken = tokenRes.refresh_token || null;
  let expiresIn = tokenRes.expires_in; // seconds

  // 3a. For Meta: exchange short-lived token (1–2 h) for long-lived token (~60 days)
  if (platform === "META") {
    const llRes = await httpGet(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token` +
      `&client_id=${encodeURIComponent(cfg.clientId())}` +
      `&client_secret=${encodeURIComponent(cfg.secret())}` +
      `&fb_exchange_token=${encodeURIComponent(accessToken)}`,
      accessToken
    ).catch(() => null);
    if (llRes?.access_token) {
      accessToken = llRes.access_token;
      expiresIn = llRes.expires_in ?? 5184000; // ~60 days fallback
    }
  }

  // 3. Fetch account info
  const info = await fetchAccountInfo(platform, accessToken);

  // 4. Save connection with encrypted tokens (find + update/create to avoid ON CONFLICT issues)
  const tokenData = {
    status: "CONNECTED",
    accessToken: encrypt(accessToken),
    refreshToken: refreshToken ? encrypt(refreshToken) : null,
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
    accountId: info.accountId || null,
    accountName: info.accountName || null,
    accountEmail: info.accountEmail || null,
    connectedAt: new Date(),
  };

  const existing = await prisma.platformConnection.findUnique({
    where: { clientId_platform: { clientId, platform } },
  });

  const connection = existing
    ? await prisma.platformConnection.update({
      where: { clientId_platform: { clientId, platform } },
      data: tokenData,
    })
    : await prisma.platformConnection.create({
      data: { clientId, platform, ...tokenData },
    });

  return { clientId, platform, accountName: info.accountName };
}

// ─── Revoke connection ─────────────────────────────────────────────────────────
async function revokeConnection(clientId, platform, requestingUserId) {
  const conn = await prisma.platformConnection.findUnique({
    where: { clientId_platform: { clientId, platform } },
    include: { client: { select: { createdById: true } } },
  });

  if (!conn) throw Object.assign(new Error("Conexão não encontrada"), { status: 404 });
  if (conn.client.createdById !== requestingUserId) {
    throw Object.assign(new Error("Sem permissão"), { status: 403 });
  }

  await prisma.platformConnection.update({
    where: { clientId_platform: { clientId, platform } },
    data: { status: "REVOKED", accessToken: null, refreshToken: null },
  });
}

// ─── Multi-tenant: listagem e seleção de página Meta ──────────────────────────

/**
 * Retorna todas as páginas FB com conta IG Business vinculada para este cliente.
 * O usuário deve escolher qual página pertence a este cliente.
 */
async function listMetaPages(clientId) {
  const conn = await prisma.platformConnection.findUnique({
    where: { clientId_platform: { clientId, platform: "META" } },
  });
  if (!conn || !conn.accessToken) {
    throw Object.assign(new Error("Conexão Meta não encontrada para este cliente"), { status: 404 });
  }

  const token = decrypt(conn.accessToken);
  const pages = await httpGet(
    "https://graph.facebook.com/v22.0/me/accounts?fields=id,name,instagram_business_account{id,name,username,followers_count}&limit=25",
    token
  );

  if (pages.error) {
    throw Object.assign(new Error(pages.error.message || "Erro ao listar páginas Meta"), { status: 400 });
  }

  return (pages.data || [])
    .filter((p) => p.instagram_business_account?.id)
    .map((p) => ({
      pageId: p.id,
      pageName: p.name,
      instagramId: p.instagram_business_account.id,
      instagramName: p.instagram_business_account.name || "",
      instagramUsername: p.instagram_business_account.username || "",
      followersCount: p.instagram_business_account.followers_count || 0,
    }));
}

/**
 * Salva a página Meta selecionada para este cliente.
 * Resolve o problema multi-tenant: cada cliente aponta para sua própria página.
 */
async function selectMetaPage(clientId, pageId, requestingUserId) {
  const conn = await prisma.platformConnection.findUnique({
    where: { clientId_platform: { clientId, platform: "META" } },
    include: { client: { select: { createdById: true } } },
  });
  if (!conn) throw Object.assign(new Error("Conexão Meta não encontrada"), { status: 404 });
  if (conn.client.createdById !== requestingUserId) {
    throw Object.assign(new Error("Sem permissão"), { status: 403 });
  }

  const token = decrypt(conn.accessToken);

  // Busca detalhes da página selecionada + conta IG vinculada
  const pageRes = await httpGet(
    `https://graph.facebook.com/v22.0/${pageId}?fields=id,name,instagram_business_account{id,name,username,followers_count}`,
    token
  );
  if (pageRes.error) {
    throw Object.assign(new Error(pageRes.error.message || "Página não encontrada"), { status: 400 });
  }
  if (!pageRes.instagram_business_account?.id) {
    throw Object.assign(
      new Error("Esta página não possui uma conta Instagram Business vinculada"),
      { status: 400 }
    );
  }

  const igAccount = pageRes.instagram_business_account;
  const existingMeta = conn.metadata ? JSON.parse(conn.metadata) : {};
  const newMeta = {
    ...existingMeta,
    pageId: pageRes.id,
    pageName: pageRes.name,
    instagramBusinessAccountId: igAccount.id,
    instagramName: igAccount.name || "",
    instagramUsername: igAccount.username || "",
  };

  await prisma.platformConnection.update({
    where: { clientId_platform: { clientId, platform: "META" } },
    data: { metadata: JSON.stringify(newMeta) },
  });

  return {
    pageId: pageRes.id,
    pageName: pageRes.name,
    instagramId: igAccount.id,
    instagramName: igAccount.name,
    instagramUsername: igAccount.username,
  };
}

// ─── GA4: listagem e seleção de propriedade ───────────────────────────────────

async function listGa4Properties(clientId) {
  const conn = await prisma.platformConnection.findUnique({
    where: { clientId_platform: { clientId, platform: "GOOGLE_ANALYTICS" } },
  });
  if (!conn || !conn.accessToken) {
    throw Object.assign(new Error("Conexão Google não encontrada para este cliente"), { status: 404 });
  }

  // Token do Google expira em ~1h — renova via refresh_token se necessário
  const token = await require("./sync.service").getValidToken(conn);
  const res = await httpGet("https://analyticsadmin.googleapis.com/v1alpha/accountSummaries", token);

  if (res.error) {
    throw Object.assign(new Error(res.error.message || "Erro ao listar propriedades GA4. Token pode ter expirado — reconecte."), { status: 400 });
  }

  const properties = [];
  for (const acc of (res.accountSummaries || [])) {
    for (const prop of (acc.propertySummaries || [])) {
      properties.push({
        propertyId: prop.property,
        propertyName: prop.displayName,
        accountName: acc.displayName,
      });
    }
  }
  return properties;
}

async function selectGa4Property(clientId, propertyId, requestingUserId) {
  const conn = await prisma.platformConnection.findUnique({
    where: { clientId_platform: { clientId, platform: "GOOGLE_ANALYTICS" } },
    include: { client: { select: { createdById: true } } },
  });
  if (!conn) throw Object.assign(new Error("Conexão Google não encontrada"), { status: 404 });
  if (conn.client.createdById !== requestingUserId) {
    throw Object.assign(new Error("Sem permissão"), { status: 403 });
  }

  const token = await require("./sync.service").getValidToken(conn);
  const propRes = await httpGet(`https://analyticsadmin.googleapis.com/v1alpha/${propertyId}`, token).catch(() => null);
  const propertyName = propRes?.displayName || propertyId;

  const existingMeta = conn.metadata ? JSON.parse(conn.metadata) : {};
  await prisma.platformConnection.update({
    where: { clientId_platform: { clientId, platform: "GOOGLE_ANALYTICS" } },
    data: { metadata: JSON.stringify({ ...existingMeta, propertyId, propertyName }) },
  });

  return { propertyId, propertyName };
}

// ─── LinkedIn: listagem e seleção de organização ──────────────────────────────

async function listLinkedinOrgs(clientId) {
  const conn = await prisma.platformConnection.findUnique({
    where: { clientId_platform: { clientId, platform: "LINKEDIN" } },
  });
  if (!conn || !conn.accessToken) {
    throw Object.assign(new Error("Conexão LinkedIn não encontrada para este cliente"), { status: 404 });
  }

  const token = decrypt(conn.accessToken);
  // Sem filtro de role/state: lista TODAS as orgs em que o usuário tem qualquer papel
  // (Super Admin, Content Admin, Analyst, etc.). O filtro role=ADMINISTRATOR escondia
  // páginas onde o usuário não é Super Admin.
  const res = await httpGet(
    "https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&count=25",
    token
  );

  if (res.serviceErrorCode || res.status === 403) {
    throw Object.assign(new Error("Permissão negada pelo LinkedIn. Verifique os escopos do app."), { status: 403 });
  }

  const orgs = [];
  const seen = new Set();
  for (const el of (res.elements || [])) {
    const orgUrn = el.organizationalTarget;
    if (seen.has(orgUrn)) continue; // dedupe: mesma org pode vir em múltiplos papéis
    seen.add(orgUrn);
    const orgId = orgUrn.split(":").pop();
    const orgRes = await httpGet(
      `https://api.linkedin.com/v2/organizations/${orgId}?fields=localizedName,vanityName`,
      token
    ).catch(() => ({}));
    orgs.push({
      organizationUrn: orgUrn,
      organizationId: orgId,
      organizationName: orgRes.localizedName || orgId,
      vanityName: orgRes.vanityName || null,
    });
  }
  return orgs;
}

async function selectLinkedinOrg(clientId, organizationUrn, requestingUserId) {
  const conn = await prisma.platformConnection.findUnique({
    where: { clientId_platform: { clientId, platform: "LINKEDIN" } },
    include: { client: { select: { createdById: true } } },
  });
  if (!conn) throw Object.assign(new Error("Conexão LinkedIn não encontrada"), { status: 404 });
  if (conn.client.createdById !== requestingUserId) {
    throw Object.assign(new Error("Sem permissão"), { status: 403 });
  }

  const token = decrypt(conn.accessToken);
  const orgId = organizationUrn.split(":").pop();
  const orgRes = await httpGet(
    `https://api.linkedin.com/v2/organizations/${orgId}?fields=localizedName`,
    token
  ).catch(() => ({}));
  const organizationName = orgRes.localizedName || orgId;

  const existingMeta = conn.metadata ? JSON.parse(conn.metadata) : {};
  await prisma.platformConnection.update({
    where: { clientId_platform: { clientId, platform: "LINKEDIN" } },
    data: { metadata: JSON.stringify({ ...existingMeta, organizationUrn, organizationId: orgId, organizationName }) },
  });

  return { organizationUrn, organizationId: orgId, organizationName };
}

module.exports = {
  buildAuthUrl, handleCallback, revokeConnection,
  listMetaPages, selectMetaPage,
  listGa4Properties, selectGa4Property,
  listLinkedinOrgs, selectLinkedinOrg,
};
