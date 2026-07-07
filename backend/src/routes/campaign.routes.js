const { Router } = require("express");
const campaignController = require("../controllers/campaign.controller");
const { authMiddleware, requireAgency } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authMiddleware);

// ── Leitura: agência E cliente-final (JWT de cliente é escopado ao próprio clientId) ──
router.get("/",                campaignController.list);      // ?clientId=
router.get("/:id",             campaignController.get);
router.get("/:id/dashboard",   campaignController.dashboard);
router.get("/:id/ai-insights", campaignController.aiInsights);

// ── Escrita e seleção de conteúdos: somente agência ──
router.post("/",      requireAgency, campaignController.create);    // ?clientId=
router.patch("/:id",  requireAgency, campaignController.update);
router.delete("/:id", requireAgency, campaignController.remove);

router.put("/:id/channels", requireAgency, campaignController.setChannels);

// Conteúdos disponíveis para associação (busca com ?q=)
router.get("/:id/assets/instagram", requireAgency, campaignController.assetsInstagram);
router.get("/:id/assets/linkedin",  requireAgency, campaignController.assetsLinkedin);
router.get("/:id/assets/pages",     requireAgency, campaignController.assetsPages);

// Associação de conteúdos / páginas
router.put("/:id/posts", requireAgency, campaignController.setPosts);
router.put("/:id/pages", requireAgency, campaignController.setPages);

module.exports = router;
