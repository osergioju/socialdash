const { Router } = require("express");
const teamController = require("../controllers/team.controller");
const { authMiddleware, requireAgency, requireRole } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authMiddleware, requireAgency);

// Listar times: qualquer usuário de agência (SUPER_ADMIN vê todos, demais só os seus)
router.get("/", teamController.list);

// Listar usuários de agência (para escolher membros) — SUPER_ADMIN
router.get("/users/all", requireRole("SUPER_ADMIN"), teamController.listUsers);

// Detalhe / gestão — SUPER_ADMIN
router.get("/:id", requireRole("SUPER_ADMIN"), teamController.get);
router.post("/", requireRole("SUPER_ADMIN"), teamController.create);
router.patch("/:id", requireRole("SUPER_ADMIN"), teamController.update);
router.delete("/:id", requireRole("SUPER_ADMIN"), teamController.remove);

router.post("/:id/members", requireRole("SUPER_ADMIN"), teamController.addMember);
router.delete("/:id/members/:userId", requireRole("SUPER_ADMIN"), teamController.removeMember);

// Mover cliente para um time — SUPER_ADMIN
router.put("/clients/:clientId", requireRole("SUPER_ADMIN"), teamController.setClientTeam);

module.exports = router;
