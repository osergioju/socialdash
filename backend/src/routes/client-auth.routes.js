const express = require("express");
const { login, me, listUsers, createUser, deleteUser } = require("../controllers/client-auth.controller");
const { authMiddleware, requireAgency } = require("../middlewares/auth.middleware");

const router = express.Router();

// Cliente final
router.post("/login", login);
router.get("/me",     authMiddleware, me);

// Gestão de usuários (agência apenas)
router.get("/users",        authMiddleware, requireAgency, listUsers);
router.post("/users",       authMiddleware, requireAgency, createUser);
router.delete("/users/:userId", authMiddleware, requireAgency, deleteUser);

module.exports = router;
