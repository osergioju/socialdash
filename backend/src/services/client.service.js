const prisma = require("../config/prisma");

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

async function listClients(userId) {
  return prisma.client.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: "desc" },
    include: {
      connections: {
        select: { platform: true, status: true, accountName: true, connectedAt: true },
      },
    },
  });
}

async function getClient(id, userId) {
  const client = await prisma.client.findFirst({
    where: { id, createdById: userId },
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
          out.pageSelected     = !!(m.instagramBusinessAccountId && m.pageId);
          out.pageName         = m.pageName || null;
          out.instagramName    = m.instagramName || null;
          out.instagramUsername = m.instagramUsername || null;
        }
      } catch {}
    }
    delete out.metadata;
    return out;
  });

  return client;
}

async function createClient(data, userId) {
  const base = slugify(data.name);
  const slug = await ensureUniqueSlug(base);
  return prisma.client.create({
    data: {
      name:        data.name,
      slug,
      logoUrl:     data.logoUrl  || null,
      website:     data.website  || null,
      notes:       data.notes    || null,
      createdById: userId,
    },
    include: { connections: true },
  });
}

async function updateClient(id, data, userId) {
  const existing = await prisma.client.findFirst({ where: { id, createdById: userId } });
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

async function deleteClient(id, userId) {
  const existing = await prisma.client.findFirst({ where: { id, createdById: userId } });
  if (!existing) throw Object.assign(new Error("Cliente não encontrado"), { status: 404 });
  await prisma.client.delete({ where: { id } });
}

module.exports = { listClients, getClient, createClient, updateClient, deleteClient };
