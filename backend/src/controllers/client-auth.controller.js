const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { userCanAccessClient } = require("../utils/teamAccess");

// ── Verifica que a agência é dona do cliente ──────────────────────────────────
async function assertOwnsClient(clientId, user) {
  const ok = await userCanAccessClient(user, clientId);
  if (!ok) throw Object.assign(new Error("Cliente não encontrado ou sem permissão"), { status: 403 });
}

// ── POST /api/client-auth/login ───────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password, clientSlug } = req.body;
    if (!email || !password || !clientSlug) {
      return res.status(400).json({ error: "email, password e clientSlug são obrigatórios" });
    }

    const client = await prisma.client.findUnique({ where: { slug: clientSlug } });
    if (!client) return res.status(404).json({ error: "Cliente não encontrado" });

    const clientUser = await prisma.clientUser.findUnique({
      where: { clientId_email: { clientId: client.id, email } },
    });
    if (!clientUser) return res.status(401).json({ error: "Credenciais inválidas" });

    const valid = await bcrypt.compare(password, clientUser.password);
    if (!valid) return res.status(401).json({ error: "Credenciais inválidas" });

    const token = jwt.sign(
      { clientUserId: clientUser.id, clientId: client.id, type: "client" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      clientUser: { id: clientUser.id, name: clientUser.name, email: clientUser.email },
      client: { id: client.id, name: client.name, slug: client.slug, logoUrl: client.logoUrl },
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

// ── GET /api/client-auth/me ───────────────────────────────────────────────────
async function me(req, res) {
  try {
    const clientUser = await prisma.clientUser.findUnique({
      where: { id: req.clientUser.clientUserId },
      select: { id: true, name: true, email: true, clientId: true },
    });
    if (!clientUser) return res.status(404).json({ error: "Usuário não encontrado" });

    const client = await prisma.client.findUnique({
      where: { id: clientUser.clientId },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });

    res.json({ clientUser, client });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

// ── GET /api/client-auth/users?clientId=xxx ───────────────────────────────────
async function listUsers(req, res) {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId obrigatório" });
    await assertOwnsClient(clientId, req.user);

    const users = await prisma.clientUser.findMany({
      where: { clientId },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(users);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

// ── POST /api/client-auth/users ───────────────────────────────────────────────
async function createUser(req, res) {
  try {
    const { clientId, name, email, password } = req.body;
    if (!clientId || !name || !email || !password) {
      return res.status(400).json({ error: "clientId, name, email e password são obrigatórios" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" });
    }
    await assertOwnsClient(clientId, req.user);

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.clientUser.create({
      data: { clientId, name, email, password: hashed },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Já existe um usuário com este e-mail neste cliente" });
    }
    res.status(err.status || 500).json({ error: err.message });
  }
}

// ── DELETE /api/client-auth/users/:userId ─────────────────────────────────────
async function deleteUser(req, res) {
  try {
    const { userId } = req.params;
    const user = await prisma.clientUser.findUnique({
      where: { id: userId },
      select: { id: true, clientId: true },
    });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    if (!(await userCanAccessClient(req.user, user.clientId))) {
      return res.status(403).json({ error: "Sem permissão" });
    }
    await prisma.clientUser.delete({ where: { id: userId } });
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { login, me, listUsers, createUser, deleteUser };
