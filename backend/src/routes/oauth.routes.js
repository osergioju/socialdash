const { Router } = require("express");
const oauthController = require("../controllers/oauth.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = Router();

// /connect and /revoke require auth; /callback is called by provider (no session)
router.get("/:platform/connect", authMiddleware, oauthController.connect);
router.get("/:platform/callback",                oauthController.callback);
router.delete("/:platform/revoke", authMiddleware, oauthController.revoke);

module.exports = router;
