const listeningService = require("../services/listening.service");
const { collectMonitoring } = require("../services/listening-collector.service");
const { z } = require("zod");

const createSchema = z.object({
  name:        z.string().min(2).max(120),
  brand:       z.string().min(1).max(120),
  keywords:    z.array(z.string().min(1).max(100)).max(50).optional(),
  hashtags:    z.array(z.string().min(1).max(100)).max(50).optional(),
  competitors: z.array(z.string().min(1).max(100)).max(50).optional(),
  language:    z.string().min(2).max(10).optional(),
  country:     z.string().min(2).max(5).optional(),
  startDate:   z.string().min(8).optional(),
  status:      z.enum(["ACTIVE", "PAUSED"]).optional(),
});

const updateSchema = createSchema.partial();

const sourcesSchema = z.object({
  sources: z.array(z.object({
    type:    z.string().min(2).max(40),
    name:    z.string().max(120).optional(),
    config:  z.record(z.any()).optional(),
    enabled: z.boolean().optional(),
  })).max(50),
});

const alertRulesSchema = z.object({
  rules: z.array(z.object({
    type:    z.string().min(2).max(60),
    config:  z.record(z.any()).optional(),
    enabled: z.boolean().optional(),
  })).max(20),
});

async function list(req, res) {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId é obrigatório" });
    const monitorings = await listeningService.listMonitorings(clientId, { user: req.user, clientUser: req.clientUser });
    res.json(monitorings);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function get(req, res) {
  try {
    const monitoring = await listeningService.getMonitoring(req.params.id, { user: req.user, clientUser: req.clientUser });
    res.json(monitoring);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function create(req, res) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId é obrigatório" });
    const monitoring = await listeningService.createMonitoring(clientId, parsed.data, { user: req.user, clientUser: req.clientUser });
    res.status(201).json(monitoring);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function update(req, res) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
  try {
    const monitoring = await listeningService.updateMonitoring(req.params.id, parsed.data, { user: req.user, clientUser: req.clientUser });
    res.json(monitoring);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    await listeningService.deleteMonitoring(req.params.id, { user: req.user, clientUser: req.clientUser });
    res.status(204).end();
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function setSources(req, res) {
  const parsed = sourcesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
  try {
    const sources = await listeningService.setSources(req.params.id, parsed.data.sources, { user: req.user, clientUser: req.clientUser });
    res.json(sources);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

// Coleta sob demanda (a periódica roda no scheduler)
async function collect(req, res) {
  try {
    await listeningService.getMonitoringScoped(req.params.id, { user: req.user, clientUser: req.clientUser });
    const result = await collectMonitoring(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function mentions(req, res) {
  try {
    const { sentiment, sourceType, urgency, q } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const data = await listeningService.listMentions(req.params.id, { user: req.user, clientUser: req.clientUser }, {
      sentiment, sourceType, urgency, q, page, pageSize,
    });
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function dashboard(req, res) {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
    const data = await listeningService.getDashboard(req.params.id, { user: req.user, clientUser: req.clientUser }, { days });
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function summary(req, res) {
  try {
    const period = req.query.period === "monthly" ? "monthly" : "weekly";
    // Regeneração forçada só para a agência — cliente final apenas visualiza
    const force = (req.query.force === "true" || req.query.force === "1") && !!req.user;
    const data = await listeningService.getExecutiveSummary(req.params.id, { user: req.user, clientUser: req.clientUser }, { period, force });
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function alertRules(req, res) {
  try {
    const rules = await listeningService.listAlertRules(req.params.id, { user: req.user, clientUser: req.clientUser });
    res.json(rules);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function setAlertRules(req, res) {
  const parsed = alertRulesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
  try {
    const rules = await listeningService.setAlertRules(req.params.id, parsed.data.rules, { user: req.user, clientUser: req.clientUser });
    res.json(rules);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  list, get, create, update, remove,
  setSources, collect, mentions, dashboard, summary,
  alertRules, setAlertRules,
};
