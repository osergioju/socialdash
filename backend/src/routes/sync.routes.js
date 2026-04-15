const { Router } = require("express");
const syncController = require("../controllers/sync.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authMiddleware);

router.post("/:clientId",        syncController.triggerSync);
router.get("/:clientId/status",  syncController.getSyncStatus);

module.exports = router;
