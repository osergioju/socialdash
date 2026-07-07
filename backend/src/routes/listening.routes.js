const { Router } = require("express");
const listeningController = require("../controllers/listening.controller");
const { authMiddleware, requireAgency } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authMiddleware);

// ── Leitura: agência E cliente-final (JWT de cliente é escopado ao próprio clientId) ──
router.get("/",              listeningController.list);      // ?clientId=
router.get("/:id",           listeningController.get);
router.get("/:id/mentions",  listeningController.mentions);  // ?sentiment=&sourceType=&urgency=&q=&page=
router.get("/:id/dashboard", listeningController.dashboard); // ?days=30
router.get("/:id/summary",   listeningController.summary);   // ?period=weekly|monthly&force=

// ── Escrita e operações: somente agência ──
router.post("/",      requireAgency, listeningController.create);   // ?clientId=
router.patch("/:id",  requireAgency, listeningController.update);
router.delete("/:id", requireAgency, listeningController.remove);

// Fontes monitoradas
router.put("/:id/sources", requireAgency, listeningController.setSources);

// Coleta sob demanda
router.post("/:id/collect", requireAgency, listeningController.collect);

// Alertas (estrutura pronta — sem notificações)
router.get("/:id/alert-rules", requireAgency, listeningController.alertRules);
router.put("/:id/alert-rules", requireAgency, listeningController.setAlertRules);

module.exports = router;
