const { Router } = require("express");
const oauthController = require("../controllers/oauth.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = Router();

// /connect e /revoke requerem auth; /callback é chamado pelo provider (sem sessão)
router.get("/:platform/connect", authMiddleware, oauthController.connect);
router.get("/:platform/callback",                oauthController.callback);
router.delete("/:platform/revoke", authMiddleware, oauthController.revoke);

// Meta: seleção de página
router.get("/meta/pages", authMiddleware, oauthController.listMetaPages);
router.post("/meta/select-page", authMiddleware, oauthController.selectMetaPage);

// Google Analytics: seleção de propriedade GA4
router.get("/google/properties", authMiddleware, oauthController.listGa4Properties);
router.post("/google/select-property", authMiddleware, oauthController.selectGa4Property);

// LinkedIn: seleção de organização
router.get("/linkedin/orgs", authMiddleware, oauthController.listLinkedinOrgs);
router.post("/linkedin/select-org", authMiddleware, oauthController.selectLinkedinOrg);

module.exports = router;
