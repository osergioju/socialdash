const syncService = require("../services/sync.service");

async function triggerSync(req, res) {
  try {
    const { clientId } = req.params;
    const result = await syncService.syncClient(clientId);
    res.json({ ok: true, result, syncedAt: new Date() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getSyncStatus(req, res) {
  try {
    const { clientId } = req.params;
    const status = await syncService.getSyncStatus(clientId);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { triggerSync, getSyncStatus };
