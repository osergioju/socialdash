const prisma = require("../config/prisma");
const syncService = require("../services/sync.service");
const { invalidateCache } = require("../services/metrics.service");

async function verifyClientAccess(clientId, userId) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, createdById: userId },
    select: { id: true },
  });
  if (!client) {
    throw Object.assign(new Error("Cliente não encontrado ou sem permissão"), { status: 403 });
  }
}

// Sync is agency-only: reject if req comes from a client JWT
function assertAgency(req) {
  if (!req.user) throw Object.assign(new Error("Acesso restrito à agência"), { status: 403 });
}

async function triggerSync(req, res) {
  try {
    assertAgency(req);
    const { clientId } = req.params;
    await verifyClientAccess(clientId, req.user.id);
    const result = await syncService.syncClient(clientId);
    invalidateCache(clientId);
    res.json({ ok: true, result, syncedAt: new Date() });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getSyncStatus(req, res) {
  try {
    assertAgency(req);
    const { clientId } = req.params;
    await verifyClientAccess(clientId, req.user.id);
    const status = await syncService.getSyncStatus(clientId);
    res.json(status);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { triggerSync, getSyncStatus };
