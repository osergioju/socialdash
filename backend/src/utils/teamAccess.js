/**
 * Controle de acesso por TIME.
 *
 * Regra: um usuário de agência enxerga um cliente se:
 *   - é SUPER_ADMIN (vê todos os clientes de todos os times), ou
 *   - pertence ao time que é dono do cliente (Client.teamId ∈ times do usuário).
 *
 * `user` aqui é o payload do JWT de agência: { id, email, role }.
 */

const prisma = require("../config/prisma");

// Fragmento `where` do Prisma para filtrar clientes visíveis ao usuário.
function clientScopeWhere(user) {
  if (user?.role === "SUPER_ADMIN") return {};
  return { team: { members: { some: { userId: user.id } } } };
}

// True se o usuário pode acessar este cliente.
async function userCanAccessClient(user, clientId) {
  if (user?.role === "SUPER_ADMIN") {
    const c = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
    return !!c;
  }
  const c = await prisma.client.findFirst({
    where: { id: clientId, team: { members: { some: { userId: user.id } } } },
    select: { id: true },
  });
  return !!c;
}

// Lança 403/404 se não puder acessar (uso em controllers/services).
async function assertClientAccess(user, clientId) {
  const ok = await userCanAccessClient(user, clientId);
  if (!ok) throw Object.assign(new Error("Cliente não encontrado ou sem acesso"), { status: 404 });
}

// IDs dos times do usuário (para validar criação de cliente, etc.).
async function userTeamIds(userId) {
  const rows = await prisma.teamMembership.findMany({ where: { userId }, select: { teamId: true } });
  return rows.map((r) => r.teamId);
}

module.exports = { clientScopeWhere, userCanAccessClient, assertClientAccess, userTeamIds };
