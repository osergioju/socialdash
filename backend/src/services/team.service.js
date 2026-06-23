const prisma = require("../config/prisma");

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function ensureUniqueSlug(base) {
  let slug = base || "time";
  let i = 0;
  while (await prisma.team.findUnique({ where: { slug } })) {
    i++;
    slug = `${base}-${i}`;
  }
  return slug;
}

// Lista times. SUPER_ADMIN vê todos; demais veem só os seus.
async function listTeams(user) {
  const where = user.role === "SUPER_ADMIN" ? {} : { members: { some: { userId: user.id } } };
  const teams = await prisma.team.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { members: true, clients: true } } },
  });
  return teams.map((t) => ({
    id: t.id, name: t.name, slug: t.slug,
    memberCount: t._count.members, clientCount: t._count.clients,
    createdAt: t.createdAt,
  }));
}

async function getTeam(id) {
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      clients: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!team) throw Object.assign(new Error("Time não encontrado"), { status: 404 });
  return {
    id: team.id, name: team.name, slug: team.slug, createdAt: team.createdAt,
    members: team.members.map((m) => m.user),
    clients: team.clients,
  };
}

async function createTeam(name) {
  const slug = await ensureUniqueSlug(slugify(name));
  return prisma.team.create({ data: { name, slug } });
}

async function updateTeam(id, name) {
  await getTeam(id);
  return prisma.team.update({ where: { id }, data: { name } });
}

async function deleteTeam(id) {
  await getTeam(id);
  // Desvincula clientes (teamId null) antes de apagar o time
  await prisma.client.updateMany({ where: { teamId: id }, data: { teamId: null } });
  await prisma.team.delete({ where: { id } });
}

async function addMember(teamId, userId) {
  await getTeam(teamId);
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!u) throw Object.assign(new Error("Usuário não encontrado"), { status: 404 });
  await prisma.teamMembership.upsert({
    where: { teamId_userId: { teamId, userId } },
    create: { teamId, userId },
    update: {},
  });
  return getTeam(teamId);
}

async function removeMember(teamId, userId) {
  await prisma.teamMembership.deleteMany({ where: { teamId, userId } });
  return getTeam(teamId);
}

// Move um cliente para um time (ou remove de time com teamId=null).
async function setClientTeam(clientId, teamId) {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) throw Object.assign(new Error("Cliente não encontrado"), { status: 404 });
  if (teamId) await getTeam(teamId);
  return prisma.client.update({ where: { id: clientId }, data: { teamId: teamId || null } });
}

// Lista usuários de agência (para escolher membros na UI).
async function listAgencyUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { createdAt: "asc" },
  });
}

module.exports = {
  listTeams, getTeam, createTeam, updateTeam, deleteTeam,
  addMember, removeMember, setClientTeam, listAgencyUsers,
};
