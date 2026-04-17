const { Router } = require("express");
const oauthController = require("../controllers/oauth.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = Router();

// /connect e /revoke requerem auth; /callback é chamado pelo provider (sem sessão)
router.get("/:platform/connect", authMiddleware, oauthController.connect);
router.get("/:platform/callback",                oauthController.callback);
router.delete("/:platform/revoke", authMiddleware, oauthController.revoke);

// Multi-tenant: seleção de página Meta por cliente
// GET  /api/oauth/meta/pages?clientId=xxx   → lista páginas disponíveis
// POST /api/oauth/meta/select-page          → salva a página escolhida para o cliente
router.get("/meta/pages", authMiddleware, oauthController.listMetaPages);
router.post("/meta/select-page", authMiddleware, oauthController.selectMetaPage);

module.exports = router;
