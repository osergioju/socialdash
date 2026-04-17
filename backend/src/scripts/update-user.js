#!/usr/bin/env node
/**
 * Atualiza dados de um usuário pelo email.
 *
 * Uso:
 *   node src/scripts/update-user.js <email> [opções]
 *
 * Opções:
 *   --password <nova-senha>
 *   --name "<novo nome>"
 *   --role <ADMIN|EDITOR|VIEWER>
 *
 * Exemplos:
 *   node src/scripts/update-user.js admin@agencia.com --password novasenha123
 *   node src/scripts/update-user.js admin@agencia.com --name "João Novo" --role EDITOR
 *   node src/scripts/update-user.js admin@agencia.com --password abc123 --role ADMIN
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const VALID_ROLES = ["ADMIN", "EDITOR", "VIEWER"];

async function main() {
  const args = process.argv.slice(2);
  const email = args[0];

  if (!email || email.startsWith("--")) {
    console.error("Uso: node src/scripts/update-user.js <email> [--password X] [--name X] [--role X]");
    process.exit(1);
  }

  // Parse --key value pairs
  const opts = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith("--") && args[i + 1]) {
      opts[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }

  if (Object.keys(opts).length === 0) {
    console.error("Nenhuma opção fornecida. Use --password, --name ou --role.");
    process.exit(1);
  }

  if (opts.role && !VALID_ROLES.includes(opts.role.toUpperCase())) {
    console.error(`Role inválida: "${opts.role}". Use: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Usuário não encontrado: "${email}"`);
    process.exit(1);
  }

  const data = {};
  if (opts.password) data.password = await bcrypt.hash(opts.password, 10);
  if (opts.name)     data.name = opts.name;
  if (opts.role)     data.role = opts.role.toUpperCase();

  const updated = await prisma.user.update({
    where: { email },
    data,
    select: { id: true, email: true, name: true, role: true, updatedAt: true },
  });

  console.log("Usuário atualizado com sucesso:");
  console.table(updated);
}

main()
  .catch((e) => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
