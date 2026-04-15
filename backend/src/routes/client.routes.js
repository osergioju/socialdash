const { Router } = require("express");
const clientController = require("../controllers/client.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authMiddleware);

router.get("/",       clientController.list);
router.get("/:id",    clientController.get);
router.post("/",      clientController.create);
router.patch("/:id",  clientController.update);
router.delete("/:id", clientController.remove);

module.exports = router;
