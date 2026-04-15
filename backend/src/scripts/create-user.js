#!/usr/bin/env node
/**
 * Cria um usuário no banco de dados.
 *
 * Uso:
 *   node src/scripts/create-user.js <email> <nome> <senha> [role]
 *
 * Roles disponíveis: ADMIN | EDITOR | VIEWER (padrão: VIEWER)
 *
 * Exemplos:
 *   node src/scripts/create-user.js admin@agencia.com "João Silva" senha123 ADMIN
 *   node src/scripts/create-user.js editor@agencia.com "Maria Lima" senha123 EDITOR
 *   node src/scripts/create-user.js viewer@agencia.com "Pedro Costa" senha123
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const VALID_ROLES = ["ADMIN", "EDITOR", "VIEWER"];

async function main() {
  const [, , email, name, password, role = "VIEWER"] = process.argv;

  if (!email || !name || !password) {
    console.error("Uso: node src/scripts/create-user.js <email> <nome> <senha> [role]");
    console.error("Roles: ADMIN | EDITOR | VIEWER (padrão: VIEWER)");
    process.exit(1);
  }

  if (!VALID_ROLES.includes(role.toUpperCase())) {
    console.error(`Role inválida: "${role}". Use: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`Erro: já existe um usuário com o email "${email}"`);
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, name, password: hashed, role: role.toUpperCase() },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  console.log("Usuário criado com sucesso:");
  console.table(user);
}

main()
  .catch((e) => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
