#!/usr/bin/env node
/**
 * Inicializa o sistema de times a partir dos dados existentes (idempotente).
 *
 *   node src/scripts/bootstrap-teams.js [nomeDoTime] [emailDoSuperAdmin]
 *
 * - Cria (ou reusa) um time (default "CRT").
 * - Adiciona TODOS os usuários de agência como membros desse time.
 * - Vincula TODOS os clientes sem time a esse time.
 * - Se informado um email, promove esse usuário a SUPER_ADMIN.
 *
 * Ex.: node src/scripts/bootstrap-teams.js CRT junior@crtcomunicacao.com.br
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") || "time";
}

async function main() {
  const teamName = process.argv[2] || "CRT";
  const superAdminEmail = process.argv[3] || null;

  // 1. Time
  let team = await prisma.team.findUnique({ where: { slug: slugify(teamName) } });
  if (!team) {
    team = await prisma.team.create({ data: { name: teamName, slug: slugify(teamName) } });
    console.log(`Time criado: ${team.name} (${team.id})`);
  } else {
    console.log(`Time já existe: ${team.name} (${team.id})`);
  }

  // 2. Todos os usuários viram membros
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  for (const u of users) {
    await prisma.teamMembership.upsert({
      where: { teamId_userId: { teamId: team.id, userId: u.id } },
      create: { teamId: team.id, userId: u.id },
      update: {},
    });
  }
  console.log(`Membros garantidos: ${users.length}`);

  // 3. Clientes sem time → vinculados ao time
  const res = await prisma.client.updateMany({ where: { teamId: null }, data: { teamId: team.id } });
  console.log(`Clientes vinculados ao time: ${res.count}`);

  // 4. Super admin
  if (superAdminEmail) {
    const u = await prisma.user.findUnique({ where: { email: superAdminEmail } });
    if (!u) {
      console.error(`⚠ Usuário não encontrado para SUPER_ADMIN: ${superAdminEmail}`);
    } else {
      await prisma.user.update({ where: { email: superAdminEmail }, data: { role: "SUPER_ADMIN" } });
      console.log(`SUPER_ADMIN definido: ${superAdminEmail}`);
    }
  }

  console.log("Bootstrap concluído.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
