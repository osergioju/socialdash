const teamService = require("../services/team.service");
const { z } = require("zod");

const nameSchema = z.object({ name: z.string().min(2).max(80) });

async function list(req, res) {
  try {
    res.json(await teamService.listTeams(req.user));
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
}

async function get(req, res) {
  try {
    res.json(await teamService.getTeam(req.params.id));
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
}

async function create(req, res) {
  const parsed = nameSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Nome inválido" });
  try {
    res.status(201).json(await teamService.createTeam(parsed.data.name));
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
}

async function update(req, res) {
  const parsed = nameSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Nome inválido" });
  try {
    res.json(await teamService.updateTeam(req.params.id, parsed.data.name));
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
}

async function remove(req, res) {
  try {
    await teamService.deleteTeam(req.params.id);
    res.status(204).end();
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
}

async function addMember(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId obrigatório" });
    res.json(await teamService.addMember(req.params.id, userId));
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
}

async function removeMember(req, res) {
  try {
    res.json(await teamService.removeMember(req.params.id, req.params.userId));
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
}

async function setClientTeam(req, res) {
  try {
    const { teamId } = req.body; // null/ausente desvincula
    res.json(await teamService.setClientTeam(req.params.clientId, teamId || null));
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
}

async function listUsers(req, res) {
  try {
    res.json(await teamService.listAgencyUsers());
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
}

module.exports = { list, get, create, update, remove, addMember, removeMember, setClientTeam, listUsers };
