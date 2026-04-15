const metricsService = require("../services/metrics.service");

async function getInstagram(req, res) {
  try {
    const data = await metricsService.getInstagramMetrics();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getLinkedin(req, res) {
  try {
    const data = await metricsService.getLinkedinMetrics();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getGa4(req, res) {
  try {
    const data = await metricsService.getGa4Metrics();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getOverview(req, res) {
  try {
    const data = await metricsService.getOverview();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getInstagram, getLinkedin, getGa4, getOverview };
