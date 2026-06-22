/**
 * Remove as linhas antigas de Indústria/Função do LinkedIn (com nomes "Indústria 42",
 * "Função 10") para que o próximo sync as recrie já com os nomes legíveis.
 * As métricas relacionadas são apagadas em cascata.
 *
 * Uso:
 *   node src/scripts/linkedin-clean-taxonomy.js <clientId>
 */

const prisma = require("../config/prisma");

async function main() {
  const clientId = process.argv[2];
  if (!clientId) {
    console.error("Uso: node src/scripts/linkedin-clean-taxonomy.js <clientId>");
    process.exit(1);
  }

  const ind = await prisma.linkedinIndustry.deleteMany({ where: { clientId } });
  const role = await prisma.linkedinRole.deleteMany({ where: { clientId } });

  console.log(`Indústrias removidas: ${ind.count}`);
  console.log(`Funções removidas:    ${role.count}`);
  console.log("Pronto. Rode um sync do cliente para recriar com os nomes corretos.");

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
