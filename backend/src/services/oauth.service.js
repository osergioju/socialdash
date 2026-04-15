/**
 * OAuth 2.0 flows for Meta (Instagram/Facebook), Google Analytics (GA4), LinkedIn.
 *
 * Flow:
 *  1. buildAuthUrl(platform, clientId, userId) → redirect URL
 *  2. handleCallback(platform, code, stateJwt) → stores encrypted token in DB
 */

const jwt    = require("jsonwebtoken");
const https  = require("https");
const prisma = require("../config/prisma");
const { encrypt } = require("../utils/crypto");

// ─── State JWT (short-lived, CSRF protection) ─────────────────────────────────
const STATE_SECRET  = () => process.env.JWT_SECRET + "_oauth_state";
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
    authUrl:   "https://www.facebook.com/dialog/oauth",
    tokenUrl:  "https://graph.facebook.com/v19.0/oauth/access_token",
    scopes:    "pages_show_list,instagram_basic,instagram_manage_insights,instagram_manage_comments,pages_read_engagement,business_management",
    clientId:  () => process.env.META_APP_ID,
    secret:    () => process.env.META_APP_SECRET,
    redirectPath: "/api/oauth/meta/callback",
  },
  GOOGLE_ANALYTICS: {
    authUrl:   "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl:  "https://oauth2.googleapis.com/token",
    scopes:    "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/userinfo.email",
    clientId:  () => process.env.GOOGLE_CLIENT_ID,
    secret:    () => process.env.GOOGLE_CLIENT_SECRET,
    redirectPath: "/api/oauth/google/callback",
  },
  LINKEDIN: {
    authUrl:   "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl:  "https://www.linkedin.com/oauth/v2/accessToken",
    scopes:    "r_organization_social rw_organization_admin r_basicprofile r_emailaddress",
    clientId:  () => process.env.LINKEDIN_CLIENT_ID,
    secret:    () => process.env.LINKEDIN_CLIENT_SECRET,
    redirectPath: "/api/oauth/linkedin/callback",
  },
};

function callbackUrl(platform) {
  const base = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
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
    client_id:     appClientId,
    redirect_uri:  callbackUrl(platform),
    response_type: "code",
    state,
    scope:         cfg.scopes,
  });

  // Google extras
  if (platform === "GOOGLE_ANALYTICS") {
    params.set("access_type", "offline");
    params.set("prompt", "consent");
  }

  return `${cfg.authUrl}?${params.toString()}`;
}

// ─── Exchange code → token ─────────────────────────────────────────────────────
function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const data   = new URLSearchParams(body).toString();
    const parsed = new URL(url);
    const opts   = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
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
      path:     parsed.pathname + parsed.search,
      headers:  { Authorization: `Bearer ${token}` },
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
    grant_type:    "authorization_code",
    code,
    redirect_uri:  callbackUrl(platform),
    client_id:     cfg.clientId(),
    client_secret: cfg.secret(),
  });

  if (tokenRes.error) {
    throw Object.assign(new Error(tokenRes.error_description || tokenRes.error), { status: 400 });
  }

  const accessToken  = tokenRes.access_token;
  const refreshToken = tokenRes.refresh_token || null;
  const expiresIn    = tokenRes.expires_in; // seconds

  // 3. Fetch account info
  const info = await fetchAccountInfo(platform, accessToken);

  // 4. Upsert connection with encrypted tokens
  const connection = await prisma.platformConnection.upsert({
    where:  { clientId_platform: { clientId, platform } },
    update: {
      status:       "CONNECTED",
      accessToken:  encrypt(accessToken),
      refreshToken: refreshToken ? encrypt(refreshToken) : null,
      expiresAt:    expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
      accountId:    info.accountId   || null,
      accountName:  info.accountName || null,
      accountEmail: info.accountEmail || null,
      connectedAt:  new Date(),
    },
    create: {
      clientId,
      platform,
      status:       "CONNECTED",
      accessToken:  encrypt(accessToken),
      refreshToken: refreshToken ? encrypt(refreshToken) : null,
      expiresAt:    expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
      accountId:    info.accountId   || null,
      accountName:  info.accountName || null,
      accountEmail: info.accountEmail || null,
      connectedAt:  new Date(),
    },
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

module.exports = { buildAuthUrl, handleCallback, revokeConnection };
