const { Router } = require("express");
const metricsController = require("../controllers/metrics.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = Router();

router.use(authMiddleware);

router.get("/overview",     metricsController.getOverview);
router.get("/instagram",    metricsController.getInstagram);
router.get("/linkedin",     metricsController.getLinkedin);
router.get("/ga4",          metricsController.getGa4);
router.get("/ai-insights",  metricsController.getAiInsights);

module.exports = router;
