const oauthService = require("../services/oauth.service");

const PLATFORM_MAP = {
  meta: "META",
  google: "GOOGLE_ANALYTICS",
  linkedin: "LINKEDIN",
};

function frontendUrl(path) {
  return (process.env.FRONTEND_URL || "http://localhost:5173") + path;
}

// GET /api/oauth/:platform/connect?clientId=xxx
async function connect(req, res) {

  const platform = PLATFORM_MAP[req.params.platform];
  if (!platform) return res.status(400).json({ error: "Plataforma desconhecida" });

  const { clientId } = req.query;
  if (!clientId) return res.status(400).json({ error: "clientId é obrigatório" });

  try {
    const url = oauthService.buildAuthUrl(platform, clientId, req.user.id);
    res.json({ url });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

// GET /api/oauth/:platform/callback?code=xxx&state=xxx
async function callback(req, res) {

  const platform = PLATFORM_MAP[req.params.platform];
  if (!platform) return res.redirect(frontendUrl("/oauth/error?reason=unknown_platform"));

  const { code, state, error: oauthError, error_description } = req.query;

  if (oauthError) {
    const msg = encodeURIComponent(error_description || oauthError);
    return res.redirect(frontendUrl(`/oauth/callback?success=false&error=${msg}`));
  }

  try {
    const result = await oauthService.handleCallback(platform, code, state);
    return res.redirect(
      frontendUrl(`/oauth/callback?success=true&platform=${platform}&clientId=${result.clientId}`)
    );
  } catch (err) {
    const msg = encodeURIComponent(err.message);
    return res.redirect(frontendUrl(`/oauth/callback?success=false&error=${msg}&platform=${platform}`));
  }
}

// DELETE /api/oauth/:platform/revoke?clientId=xxx
async function revoke(req, res) {

  const platform = PLATFORM_MAP[req.params.platform];
  if (!platform) return res.status(400).json({ error: "Plataforma desconhecida" });

  const { clientId } = req.query;
  if (!clientId) return res.status(400).json({ error: "clientId é obrigatório" });

  try {
    await oauthService.revokeConnection(clientId, platform, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

// GET /api/oauth/meta/pages?clientId=xxx
// Lista páginas FB com IG Business vinculado para o cliente especificado.
// Usado no fluxo de seleção de página (multi-tenant fix).
async function listMetaPages(req, res) {
  const { clientId } = req.query;
  if (!clientId) return res.status(400).json({ error: "clientId é obrigatório" });
  try {
    const pages = await oauthService.listMetaPages(clientId);
    res.json({ pages });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

// POST /api/oauth/meta/select-page
// Body: { clientId, pageId }
// Associa uma página específica do Facebook (e seu IG Business Account) a este cliente.
async function selectMetaPage(req, res) {
  const { clientId, pageId } = req.body;
  if (!clientId || !pageId) {
    return res.status(400).json({ error: "clientId e pageId são obrigatórios" });
  }
  try {
    const result = await oauthService.selectMetaPage(clientId, pageId, req.user.id);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

// GET /api/oauth/google/properties?clientId=xxx
async function listGa4Properties(req, res) {
  const { clientId } = req.query;
  if (!clientId) return res.status(400).json({ error: "clientId é obrigatório" });
  try {
    const properties = await oauthService.listGa4Properties(clientId);
    res.json({ properties });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

// POST /api/oauth/google/select-property
// Body: { clientId, propertyId }
async function selectGa4Property(req, res) {
  const { clientId, propertyId } = req.body;
  if (!clientId || !propertyId) {
    return res.status(400).json({ error: "clientId e propertyId são obrigatórios" });
  }
  try {
    const result = await oauthService.selectGa4Property(clientId, propertyId, req.user.id);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

// GET /api/oauth/linkedin/orgs?clientId=xxx
async function listLinkedinOrgs(req, res) {
  const { clientId } = req.query;
  if (!clientId) return res.status(400).json({ error: "clientId é obrigatório" });
  try {
    const orgs = await oauthService.listLinkedinOrgs(clientId);
    res.json({ orgs });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

// POST /api/oauth/linkedin/select-org
// Body: { clientId, organizationUrn }
async function selectLinkedinOrg(req, res) {
  const { clientId, organizationUrn } = req.body;
  if (!clientId || !organizationUrn) {
    return res.status(400).json({ error: "clientId e organizationUrn são obrigatórios" });
  }
  try {
    const result = await oauthService.selectLinkedinOrg(clientId, organizationUrn, req.user.id);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { connect, callback, revoke, listMetaPages, selectMetaPage, listGa4Properties, selectGa4Property, listLinkedinOrgs, selectLinkedinOrg };
