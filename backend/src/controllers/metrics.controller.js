const prisma = require("../config/prisma");
const metricsService = require("../services/metrics.service");


async function verifyClientAccess(clientId, req) {
  if (req.clientUser) {
    // Client JWT: token is scoped to a specific clientId — just verify it matches
    if (req.clientUser.clientId !== clientId) {
      throw Object.assign(new Error("Sem permissão"), { status: 403 });
    }
  } else {
    // Agency JWT: verify the requesting user owns this client
    const client = await prisma.client.findFirst({
      where: { id: clientId, createdById: req.user.id },
      select: { id: true },
    });
    if (!client) {
      throw Object.assign(new Error("Cliente não encontrado ou sem permissão"), { status: 403 });
    }
  }
}

async function getInstagram(req, res) {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId obrigatório" });
    await verifyClientAccess(clientId, req);
    const data = await metricsService.getInstagramMetrics(clientId);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getLinkedin(req, res) {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId obrigatório" });
    await verifyClientAccess(clientId, req);
    const data = await metricsService.getLinkedinMetrics(clientId);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getGa4(req, res) {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId obrigatório" });
    await verifyClientAccess(clientId, req);
    const data = await metricsService.getGa4Metrics(clientId);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getOverview(req, res) {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId obrigatório" });
    await verifyClientAccess(clientId, req);
    const data = await metricsService.getOverview(clientId);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getAiInsights(req, res) {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId obrigatório" });
    await verifyClientAccess(clientId, req);
    const force = req.query.force === "true";
    const data = await metricsService.getAiInsights(clientId, force);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { getInstagram, getLinkedin, getGa4, getOverview, getAiInsights };
