const prisma = require("../config/prisma");
const { clientScopeWhere, userTeamIds } = require("../utils/teamAccess");

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function ensureUniqueSlug(base, excludeId = null) {
  let slug = base;
  let i = 0;
  while (true) {
    const existing = await prisma.client.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    i++;
    slug = `${base}-${i}`;
  }
}

async function listClients(user) {
  return prisma.client.findMany({
    where: clientScopeWhere(user),
    orderBy: { createdAt: "desc" },
    include: {
      team: { select: { id: true, name: true } },
      connections: {
        select: { platform: true, status: true, accountName: true, connectedAt: true },
      },
    },
  });
}

async function getClient(id, user) {
  const client = await prisma.client.findFirst({
    where: { id, ...clientScopeWhere(user) },
    include: {
      connections: {
        select: {
          id: true, platform: true, status: true,
          accountId: true, accountName: true, accountEmail: true,
          expiresAt: true, connectedAt: true, metadata: true,
        },
      },
    },
  });
  if (!client) throw Object.assign(new Error("Cliente não encontrado"), { status: 404 });

  // Processa metadata de cada conexão — expõe apenas campos seguros, sem tokens
  client.connections = client.connections.map((conn) => {
    const out = { ...conn };
    if (conn.metadata) {
      try {
        const m = JSON.parse(conn.metadata);
        if (conn.platform === "META") {
          out.pageSelected      = !!(m.instagramBusinessAccountId && m.pageId);
          out.pageName          = m.pageName || null;
          out.instagramName     = m.instagramName || null;
          out.instagramUsername = m.instagramUsername || null;
        }
        if (conn.platform === "GOOGLE_ANALYTICS") {
          out.propertySelected = !!m.propertyId;
          out.propertyId       = m.propertyId || null;
          out.propertyName     = m.propertyName || null;
        }
        if (conn.platform === "LINKEDIN") {
          out.orgSelected      = !!m.organizationUrn;
          out.organizationName = m.organizationName || null;
          out.vanityName       = m.vanityName || null;
        }
      } catch {}
    }
    delete out.metadata;
    return out;
  });

  return client;
}

async function createClient(data, user) {
  // Define o time dono: se informado, valida acesso; senão usa o (único) time do usuário.
  const teamIds = await userTeamIds(user.id);
  let teamId = data.teamId || null;
  if (teamId) {
    if (user.role !== "SUPER_ADMIN" && !teamIds.includes(teamId)) {
      throw Object.assign(new Error("Você não pertence a este time"), { status: 403 });
    }
  } else if (user.role !== "SUPER_ADMIN") {
    if (teamIds.length === 0) throw Object.assign(new Error("Você não pertence a nenhum time"), { status: 400 });
    if (teamIds.length > 1) throw Object.assign(new Error("Informe o time (teamId) para este cliente"), { status: 400 });
    teamId = teamIds[0];
  }
  if (!teamId) throw Object.assign(new Error("Informe o time (teamId) para este cliente"), { status: 400 });

  const base = slugify(data.name);
  const slug = await ensureUniqueSlug(base);
  return prisma.client.create({
    data: {
      name:        data.name,
      slug,
      logoUrl:     data.logoUrl  || null,
      website:     data.website  || null,
      notes:       data.notes    || null,
      createdById: user.id,
      teamId,
    },
    include: { connections: true },
  });
}

async function updateClient(id, data, user) {
  const existing = await prisma.client.findFirst({ where: { id, ...clientScopeWhere(user) } });
  if (!existing) throw Object.assign(new Error("Cliente não encontrado"), { status: 404 });

  const slug = data.name && data.name !== existing.name
    ? await ensureUniqueSlug(slugify(data.name), id)
    : existing.slug;

  return prisma.client.update({
    where: { id },
    data: {
      name:    data.name    ?? existing.name,
      slug,
      logoUrl: data.logoUrl ?? existing.logoUrl,
      website: data.website ?? existing.website,
      notes:   data.notes   ?? existing.notes,
    },
    include: { connections: { select: { platform: true, status: true, accountName: true } } },
  });
}

async function deleteClient(id, user) {
  const existing = await prisma.client.findFirst({ where: { id, ...clientScopeWhere(user) } });
  if (!existing) throw Object.assign(new Error("Cliente não encontrado"), { status: 404 });
  await prisma.client.delete({ where: { id } });
}

module.exports = { listClients, getClient, createClient, updateClient, deleteClient };
