const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SALT_ROUNDS = 10;

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function createError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ─── SERVICES ────────────────────────────────────────────────────────────────
async function register({ email, name, password }) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw createError("Email já cadastrado", 409);
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
    select: USER_SELECT,
  });

  return user;
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // 🔒 não revela se email existe
  if (!user) {
    throw createError("Credenciais inválidas", 401);
  }

  const isValidPassword = await comparePassword(password, user.password);

  if (!isValidPassword) {
    throw createError("Credenciais inválidas", 401);
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const token = generateToken(tokenPayload);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

module.exports = {
  register,
  login,
};