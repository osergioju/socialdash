const { Router } = require("express");
const listeningController = require("../controllers/listening.controller");
const { authMiddleware, requireAgency } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authMiddleware);
router.use(requireAgency);

// CRUD de monitoramentos
router.get("/",       listeningController.list);    // ?clientId=
router.post("/",      listeningController.create);  // ?clientId=
router.get("/:id",    listeningController.get);
router.patch("/:id",  listeningController.update);
router.delete("/:id", listeningController.remove);

// Fontes monitoradas
router.put("/:id/sources", listeningController.setSources);

// Coleta sob demanda
router.post("/:id/collect", listeningController.collect);

// Menções (?sentiment=&sourceType=&urgency=&q=&page=&pageSize=)
router.get("/:id/mentions", listeningController.mentions);

// Dashboard (?days=30) + Resumo executivo IA (?period=weekly|monthly&force=)
router.get("/:id/dashboard", listeningController.dashboard);
router.get("/:id/summary",   listeningController.summary);

// Alertas (estrutura pronta — sem notificações)
router.get("/:id/alert-rules", listeningController.alertRules);
router.put("/:id/alert-rules", listeningController.setAlertRules);

module.exports = router;
