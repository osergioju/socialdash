const metricsService = require("../services/metrics.service");

async function getInstagram(req, res) {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId obrigatório" });
    const data = await metricsService.getInstagramMetrics(clientId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getLinkedin(req, res) {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId obrigatório" });
    const data = await metricsService.getLinkedinMetrics(clientId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getGa4(req, res) {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId obrigatório" });
    const data = await metricsService.getGa4Metrics(clientId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getOverview(req, res) {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId obrigatório" });
    const data = await metricsService.getOverview(clientId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getInstagram, getLinkedin, getGa4, getOverview };
