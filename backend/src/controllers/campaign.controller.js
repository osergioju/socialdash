const campaignService = require("../services/campaign.service");
const { z } = require("zod");

const channelEnum = z.enum(["INSTAGRAM", "LINKEDIN", "WEBSITE"]);

const createSchema = z.object({
  name:        z.string().min(2).max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  startDate:   z.string().min(8),
  endDate:     z.string().min(8),
  status:      z.enum(["PLANNING", "ACTIVE", "ENDED"]).optional(),
  color:       z.string().max(20).optional().or(z.literal("")),
  imageUrl:    z.string().url().optional().or(z.literal("")),
  objective:   z.string().max(500).optional().or(z.literal("")),
  tags:        z.array(z.string().max(50)).max(20).optional(),
  responsible: z.string().max(120).optional().or(z.literal("")),
  notes:       z.string().max(2000).optional().or(z.literal("")),
  channels:    z.array(channelEnum).optional(),
});

const updateSchema = createSchema.partial();

const postsSchema = z.object({
  channel: channelEnum,
  posts: z.array(z.object({
    externalId:   z.string().min(1),
    caption:      z.string().nullable().optional(),
    mediaType:    z.string().nullable().optional(),
    thumbnailUrl: z.string().nullable().optional(),
    permalink:    z.string().nullable().optional(),
    publishedAt:  z.string().nullable().optional(),
    metrics:      z.record(z.any()).optional(),
  })).max(500),
});

const pagesSchema = z.object({
  pages: z.array(z.object({
    pagePath: z.string().min(1).max(500),
    label:    z.string().max(200).nullable().optional(),
  })).max(200),
});

async function list(req, res) {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId é obrigatório" });
    const campaigns = await campaignService.listCampaigns(clientId, req.user);
    res.json(campaigns);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function get(req, res) {
  try {
    const campaign = await campaignService.getCampaign(req.params.id, req.user);
    res.json(campaign);
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
    const campaign = await campaignService.createCampaign(clientId, parsed.data, req.user);
    res.status(201).json(campaign);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function update(req, res) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
  try {
    const campaign = await campaignService.updateCampaign(req.params.id, parsed.data, req.user);
    res.json(campaign);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    await campaignService.deleteCampaign(req.params.id, req.user);
    res.status(204).end();
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function setChannels(req, res) {
  const parsed = z.object({ channels: z.array(channelEnum) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
  try {
    const channels = await campaignService.setChannels(req.params.id, parsed.data.channels, req.user);
    res.json(channels);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function assetsInstagram(req, res) {
  try {
    const items = await campaignService.getAvailableInstagram(req.params.id, req.user, { q: req.query.q });
    res.json(items);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function assetsLinkedin(req, res) {
  try {
    const items = await campaignService.getAvailableLinkedin(req.params.id, req.user, { q: req.query.q });
    res.json(items);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function assetsPages(req, res) {
  try {
    const items = await campaignService.getAvailablePages(req.params.id, req.user, { q: req.query.q });
    res.json(items);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function setPosts(req, res) {
  const parsed = postsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
  try {
    const posts = await campaignService.setPosts(req.params.id, parsed.data.channel, parsed.data.posts, req.user);
    res.json(posts);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function setPages(req, res) {
  const parsed = pagesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
  try {
    const pages = await campaignService.setPages(req.params.id, parsed.data.pages, req.user);
    res.json(pages);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function dashboard(req, res) {
  try {
    const data = await campaignService.getDashboard(req.params.id, req.user);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function aiInsights(req, res) {
  try {
    const force = req.query.force === "true" || req.query.force === "1";
    const data = await campaignService.getAiInsights(req.params.id, req.user, force);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  list, get, create, update, remove,
  setChannels, setPosts, setPages,
  assetsInstagram, assetsLinkedin, assetsPages,
  dashboard, aiInsights,
};
