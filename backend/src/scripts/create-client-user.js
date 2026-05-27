/**
 * Creates a ClientUser login for a specific client.
 *
 * Usage:
 *   node src/scripts/create-client-user.js <clientSlug> <email> <name> <password>
 *
 * Example:
 *   node src/scripts/create-client-user.js minha-empresa joao@empresa.com "João Silva" senha123
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const [, , slug, email, name, password] = process.argv;

  if (!slug || !email || !name || !password) {
    console.error("Uso: node create-client-user.js <clientSlug> <email> <nome> <senha>");
    process.exit(1);
  }

  const client = await prisma.client.findUnique({ where: { slug } });
  if (!client) {
    console.error(`Cliente com slug "${slug}" não encontrado.`);
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.clientUser.upsert({
    where: { clientId_email: { clientId: client.id, email } },
    update: { name, password: hashed },
    create: { clientId: client.id, email, name, password: hashed },
  });

  console.log(`\n✅ Usuário criado/atualizado:`);
  console.log(`   Cliente : ${client.name} (${client.slug})`);
  console.log(`   Nome    : ${user.name}`);
  console.log(`   E-mail  : ${user.email}`);
  console.log(`   Acesso  : /c/${client.slug}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
