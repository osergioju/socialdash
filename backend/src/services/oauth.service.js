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
    scopes: "r_organization_social rw_organization_admin r_basicprofile r_emailaddress",
    clientId: () => process.env.LINKEDIN_CLIENT_ID,
    secret: () => process.env.LINKEDIN_CLIENT_SECRET,
    redirectPath: "/oauth/linkedin/callback",
  },
};

function callbackUrl(platform) {
  const base = process.env.BACKEND_URL || `http://comunity.crtcomunicacao.com.br/api`;
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
    scope: cfg.scopes,
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
      const me = await httpGet("https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName)", accessToken);
      const name = `${me.localizedFirstName || ""} ${me.localizedLastName || ""}`.trim();
      // email requires separate call
      const emailRes = await httpGet("https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))", accessToken).catch(() => null);
      const email = emailRes?.elements?.[0]?.["handle~"]?.emailAddress;
      return { accountId: me.id, accountName: name, accountEmail: email };
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

  const accessToken = tokenRes.access_token;
  const refreshToken = tokenRes.refresh_token || null;
  const expiresIn = tokenRes.expires_in; // seconds

  console.log(accessToken);
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

module.exports = { buildAuthUrl, handleCallback, revokeConnection, listMetaPages, selectMetaPage };
