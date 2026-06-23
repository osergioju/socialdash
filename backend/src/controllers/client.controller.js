const clientService = require("../services/client.service");
const { z } = require("zod");

const createSchema = z.object({
  name: z.string().min(2).max(100),
  logoUrl: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
  teamId: z.string().optional(),
});

const updateSchema = createSchema.partial();

async function list(req, res) {
  try {
    const clients = await clientService.listClients(req.user);
    res.json(clients);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function get(req, res) {
  try {
    const client = await clientService.getClient(req.params.id, req.user);
    res.json(client);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function create(req, res) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
  try {
    const client = await clientService.createClient(parsed.data, req.user);
    res.status(201).json(client);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function update(req, res) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
  try {
    const client = await clientService.updateClient(req.params.id, parsed.data, req.user);
    res.json(client);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    await clientService.deleteClient(req.params.id, req.user);
    res.status(204).end();
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { list, get, create, update, remove };
