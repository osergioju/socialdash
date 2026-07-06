const { Router } = require("express");
const campaignController = require("../controllers/campaign.controller");
const { authMiddleware, requireAgency } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authMiddleware);
router.use(requireAgency);

// CRUD
router.get("/",       campaignController.list);      // ?clientId=
router.post("/",      campaignController.create);    // ?clientId=
router.get("/:id",    campaignController.get);
router.patch("/:id",  campaignController.update);
router.delete("/:id", campaignController.remove);

// Canais
router.put("/:id/channels", campaignController.setChannels);

// Conteúdos disponíveis para associação (busca com ?q=)
router.get("/:id/assets/instagram", campaignController.assetsInstagram);
router.get("/:id/assets/linkedin",  campaignController.assetsLinkedin);
router.get("/:id/assets/pages",     campaignController.assetsPages);

// Associação de conteúdos / páginas
router.put("/:id/posts", campaignController.setPosts);
router.put("/:id/pages", campaignController.setPages);

// Dashboard consolidado + Insights IA
router.get("/:id/dashboard",   campaignController.dashboard);
router.get("/:id/ai-insights", campaignController.aiInsights);

module.exports = router;
