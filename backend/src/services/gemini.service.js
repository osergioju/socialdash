const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

async function generateInsights({ clientName, ig, li, ga4 }) {
  const platforms = [];
  if (ig)  platforms.push("Instagram");
  if (li)  platforms.push("LinkedIn");
  if (ga4) platforms.push("Site/GA4");

  const igBlock = ig ? `
## Instagram (último mês disponível)
- Seguidores: ${ig.seguidores} (novos: ${ig.novosSeguidores})
- Alcance orgânico: ${ig.alcanceOrganico} | Visualizações: ${ig.visualizacoes}
- Interações: ${ig.interacoes} | Visitas ao perfil: ${ig.visitasPerfil}
- Reels: ${ig.reelsQtd} publicados, alcance ${ig.reelsAlcance}, interações ${ig.reelsInteracoes}
- Stories: ${ig.storiesQtd} publicados, ${ig.storiesViews} views
- Posts: curtidas ${ig.curtidasPosts}, comentários ${ig.comentariosPosts}, compartilhamentos ${ig.compartilhamentosPosts}, salvamentos ${ig.salvamentosPosts}
- Total de postagens: ${ig.postagensTotal}
` : "";

  const liBlock = li ? `
## LinkedIn (último mês disponível)
- Seguidores: ${li.seguidores} (novos: ${li.novosSeguidores})
- Alcance: ${li.alcance} | Impressões: ${li.impressoes}
- Engajamento: ${li.engajamento} | Cliques: ${li.cliques} | Reações: ${li.reacoes}
- Postagens: ${li.postagens}
` : "";

  const ga4Block = ga4 ? `
## Site / GA4 (último mês disponível)
- Usuários ativos: ${ga4.usuariosAtivos} (novos: ${ga4.novosUsuarios})
- Sessões: ${ga4.sessoes} (engajadas: ${ga4.sessoesEngajadas})
- Taxa de engajamento: ${(ga4.taxaEngajamento * 100).toFixed(1)}%
- Tempo médio de engajamento: ${ga4.tempoMedioEngajamento}s
- Views por sessão: ${ga4.viewsPorSessao}
- Total de eventos: ${ga4.numEventos}
` : "";

  const prompt = `Você é um analista de marketing digital especializado em redes sociais e performance digital.
Analise os dados abaixo do cliente "${clientName}" e gere insights estratégicos em português brasileiro.

Plataformas disponíveis: ${platforms.join(", ")}
${igBlock}${liBlock}${ga4Block}
Retorne APENAS um JSON válido (sem markdown, sem blocos de código) com esta estrutura:
{
  "canalPrincipal": [
    {
      "metric": "nome da métrica em português",
      "winner": "nome do canal vencedor",
      "value": "valor ou descrição curta (máx 25 chars)",
      "platform": "instagram|linkedin|ga4|mixed",
      "note": "observação de uma linha (máx 45 chars)"
    }
  ],
  "insights": [
    {
      "title": "emoji + título curto (máx 30 chars)",
      "desc": "1-2 frases com recomendação acionável baseada nos números reais",
      "platform": "instagram|linkedin|ga4|mixed"
    }
  ]
}

Regras:
- Gere exatamente 6 itens em canalPrincipal e 6 itens em insights
- Use apenas plataformas com dados disponíveis
- Métricas para canalPrincipal: Crescimento Seguidores, Engajamento/Post, Alcance Orgânico, Cliques/Ações, Tráfego pro Site, Autoridade de Marca
- Os insights devem citar números reais dos dados fornecidos e sugerir ações concretas
- platform deve ser exatamente um dos valores: instagram, linkedin, ga4, mixed`;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.35,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const body = await res.json();
  const text = body.choices?.[0]?.message?.content ?? "";

  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(clean);
}

async function categorizeInstagramPosts({ clientName, posts, platformLabel = "Instagram" }) {
  // posts: [{index, id, caption, likes, comments, reach, shares, month}]
  const postList = posts
    .map((p) => `${p.index}.[${p.month}]"${(p.caption || "").slice(0, 70).replace(/\n/g, " ")}" l:${p.likes} c:${p.comments}`)
    .join("\n");

  const prompt = `Agrupe os posts do ${platformLabel} de "${clientName}" em 5-8 temas em português. Retorne APENAS JSON válido:
{"themes":[{"tema":"Nome","icon":"emoji","postIndexes":[1,2]}]}
Regras: cada post em exatamente 1 tema, índices começam em 1, temas concisos (ex: "IPCA / Inflação", "Educação Financeira").

Posts (índice.[mês]"legenda" l=likes c=comentários):
${postList}`;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const body = await res.json();
  const text = body.choices?.[0]?.message?.content ?? "";
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(clean);
}

// ─── Helper compartilhado: chama a Groq e retorna JSON parseado ───────────────
async function callGroqJson(prompt, maxTokens = 2048, temperature = 0.35) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const body = await res.json();
  const text = body.choices?.[0]?.message?.content ?? "";
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(clean);
}

// ─── Campanhas: insights sobre os conteúdos vinculados à campanha ─────────────
// A análise usa EXCLUSIVAMENTE os ativos vinculados (posts selecionados +
// páginas selecionadas), respondendo às perguntas-chave da campanha.
async function generateCampaignInsights({ campaign, dashboard }) {
  const { website, instagram, linkedin, consolidado } = dashboard;

  const MEDIA_LABEL = { IMAGE: "Feed", CAROUSEL_ALBUM: "Carrossel", REEL: "Reel", VIDEO: "Vídeo" };

  // Breakdown de formatos do Instagram (Reel, Feed, Carrossel, Vídeo)
  let formatosBlock = "";
  if (instagram?.posts?.length) {
    const byFormat = {};
    for (const p of instagram.posts) {
      const f = MEDIA_LABEL[p.mediaType] || p.mediaType || "Outro";
      if (!byFormat[f]) byFormat[f] = { count: 0, reach: 0, engagement: 0 };
      byFormat[f].count++;
      byFormat[f].reach += p.metrics?.reach ?? 0;
      byFormat[f].engagement += (p.metrics?.likes ?? 0) + (p.metrics?.comments ?? 0) + (p.metrics?.shares ?? 0) + (p.metrics?.saved ?? 0);
    }
    formatosBlock = `
## Formatos (Instagram)
${Object.entries(byFormat).map(([f, s]) => `- ${f}: ${s.count} post(s), alcance total ${s.reach}, engajamento total ${s.engagement}`).join("\n")}
`;
  }

  const igBlock = instagram ? `
## Instagram (${instagram.postsCount} posts vinculados)
- Alcance total: ${instagram.totals.reach} | Impressões/plays: ${instagram.totals.impressions}
- Curtidas: ${instagram.totals.likes} | Comentários: ${instagram.totals.comments}
- Compartilhamentos: ${instagram.totals.shares} | Salvamentos: ${instagram.totals.saved}
- Engajamento total: ${instagram.totals.engagement}
- Posts (formato | legenda | métricas): ${(instagram.posts || []).slice(0, 8).map((p) => `[${MEDIA_LABEL[p.mediaType] || p.mediaType}] "${(p.caption || "").slice(0, 50).replace(/\n/g, " ")}" (alcance ${p.metrics?.reach ?? 0}, curtidas ${p.metrics?.likes ?? 0}, comentários ${p.metrics?.comments ?? 0})`).join("; ")}
` : "";

  const liBlock = linkedin ? `
## LinkedIn (${linkedin.postsCount} publicações vinculadas)
- Impressões: ${linkedin.totals.impressions} | Alcance: ${linkedin.totals.reach}
- Reações: ${linkedin.totals.reactions} | Comentários: ${linkedin.totals.comments}
- Cliques: ${linkedin.totals.clicks} | CTR: ${linkedin.totals.ctr}%
- Engajamento total: ${linkedin.totals.engagement}
- Publicações: ${(linkedin.posts || []).slice(0, 8).map((p) => `"${(p.caption || "").slice(0, 50).replace(/\n/g, " ")}" (impressões ${p.metrics?.impressions ?? 0}, reações ${p.metrics?.reactions ?? 0}, cliques ${p.metrics?.clicks ?? 0})`).join("; ")}
` : "";

  const gaBlock = website ? `
## Website / GA4 (${website.pagesCount} páginas vinculadas, dados do período da campanha)
- Sessões: ${website.totals.sessions} | Usuários: ${website.totals.users} (novos: ${website.totals.newUsers})
- Visualizações: ${website.totals.views} | Tempo médio: ${website.totals.avgEngagementTime}s
- Eventos: ${website.totals.events} | Conversões: ${website.totals.conversions}
- Taxa de engajamento: ${website.totals.engagementRate}%
- Por página: ${(website.pages || []).slice(0, 10).map((p) => `${p.pagePath} (views ${p.views}, sessões ${p.sessions}, usuários ${p.users})`).join("; ")}
- Evolução diária (sessões): ${(website.timeseries || []).map((t) => `${t.date}:${t.sessions}`).join(", ")}
` : "";

  const prompt = `Você é um analista sênior de marketing digital. A campanha "${campaign.name}" do cliente "${campaign.clientName}" é um AGRUPAMENTO de conteúdos já publicados — analise SOMENTE os ativos vinculados abaixo e responda em português brasileiro.

Campanha: ${campaign.name}
Objetivo: ${campaign.objective || "não informado"}
Período: ${campaign.startDate} a ${campaign.endDate}
Canais com conteúdos vinculados: ${(campaign.channels || []).join(", ") || "nenhum"}
${igBlock}${liBlock}${gaBlock}${formatosBlock}
## Consolidado
- Alcance total: ${consolidado?.totalReach ?? 0} | Impressões totais: ${consolidado?.totalImpressions ?? 0}
- Engajamento total: ${consolidado?.totalEngagement ?? 0} | Cliques totais: ${consolidado?.totalClicks ?? 0}

Retorne APENAS um JSON válido (sem markdown) com esta estrutura:
{
  "resumoExecutivo": "parágrafo de 3-5 frases resumindo a performance da campanha com números reais",
  "melhorPublicacao": { "canal": "instagram|linkedin", "descricao": "trecho da legenda + números", "motivo": "por que teve o melhor desempenho" },
  "canalMaiorEngajamento": { "canal": "instagram|linkedin|website", "motivo": "1-2 frases com números" },
  "paginaMaisVisitada": { "pagina": "/caminho", "analise": "números e leitura do resultado" },
  "trafegoParaOSite": "análise de como os conteúdos se relacionaram com o tráfego do site no período (dias de pico vs datas de publicação)",
  "crescimentoNoPeriodo": "houve crescimento durante a campanha? compare início e fim do período com números",
  "temasComMelhorAceitacao": ["tema identificado nos conteúdos com melhor resposta", "..."],
  "formatosQuePerformaram": ["Reel — análise com números", "Carrossel — ...", "..."],
  "aprendizados": ["aprendizado acionável para a próxima campanha", "..."],
  "sugestoesProximaCampanha": ["sugestão concreta", "..."]
}

Regras:
- Analise APENAS os conteúdos vinculados listados acima
- Cite números reais dos dados fornecidos
- Arrays com 2-5 itens cada
- Se um canal não tem conteúdos vinculados, retorne null no campo correspondente (ex: paginaMaisVisitada: null se não há páginas)
- Se não houver dados suficientes, explique o que falta no próprio campo`;

  return callGroqJson(prompt, 2500);
}

// ─── Social Listening: analisa um lote de menções ─────────────────────────────
// mentions: [{ index, title, text, sourceType, sourceName }]
// Retorna { analyses: [{ index, sentiment, score, summary, category, theme, urgency, intent, entities, suggestedReply }] }
async function analyzeMentions({ brand, competitors, mentions }) {
  const list = mentions
    .map((m) => `${m.index}. [${m.sourceType}${m.sourceName ? "/" + m.sourceName : ""}] "${(m.title || "").slice(0, 120)}" — ${(m.text || "").slice(0, 300).replace(/\n/g, " ")}`)
    .join("\n");

  const prompt = `Você é um analista de social listening. A marca monitorada é "${brand}".${competitors?.length ? ` Concorrentes: ${competitors.join(", ")}.` : ""}
Analise cada menção abaixo em relação à marca e retorne APENAS um JSON válido:
{"analyses":[{"index":1,"sentiment":"POSITIVE|NEGATIVE|NEUTRAL","score":-1.0,"summary":"resumo em 1 frase","category":"categoria curta (ex: Reclamação, Notícia, Review, Dúvida, Elogio)","theme":"tema principal em 2-4 palavras","urgency":"baixa|media|alta","intent":"intenção do autor (ex: informar, reclamar, elogiar, perguntar, comparar)","entities":["entidades citadas"],"suggestedReply":"sugestão de resposta em pt-BR quando fizer sentido responder, senão null"}]}

Regras:
- score: -1.0 (muito negativo) a 1.0 (muito positivo), coerente com sentiment
- urgency alta apenas para crises, reclamações graves ou riscos reputacionais
- Um item por menção, na mesma ordem dos índices
- Textos em português brasileiro

Menções:
${list}`;

  return callGroqJson(prompt, 3000, 0.2);
}

// ─── Social Listening: resumo executivo do período ────────────────────────────
async function generateListeningSummary({ monitoring, stats, sampleMentions, periodLabel }) {
  const list = (sampleMentions || [])
    .map((m, i) => `${i + 1}. [${m.sourceType}] (${m.sentiment || "?"}) "${(m.title || "").slice(0, 100)}" — ${(m.summary || m.text || "").slice(0, 160).replace(/\n/g, " ")}`)
    .join("\n");

  const prompt = `Você é um analista de reputação de marca. Gere um resumo executivo de social listening da marca "${monitoring.brand}" (monitoramento "${monitoring.name}") para o período: ${periodLabel}.

## Estatísticas do período
- Total de menções: ${stats.total}
- Positivas: ${stats.positive} | Negativas: ${stats.negative} | Neutras: ${stats.neutral}
- Sentimento médio (score -1 a 1): ${stats.avgScore}
- Menções por fonte: ${Object.entries(stats.bySource || {}).map(([k, v]) => `${k}: ${v}`).join(", ") || "n/d"}
- Top temas: ${(stats.topThemes || []).join(", ") || "n/d"}

## Amostra de menções
${list || "sem menções no período"}

Retorne APENAS um JSON válido (sem markdown):
{
  "principaisAssuntos": ["assunto", "..."],
  "percepcaoDaMarca": "parágrafo de 2-4 frases",
  "temasEmergentes": ["tema", "..."],
  "criticasRecorrentes": ["crítica", "..."],
  "elogiosRecorrentes": ["elogio", "..."],
  "oportunidades": ["oportunidade", "..."],
  "riscos": ["risco", "..."],
  "recomendacoes": ["recomendação acionável", "..."],
  "tendencias": ["tendência", "..."],
  "resumo": "resumo geral do período em 3-5 frases"
}

Regras: português brasileiro; arrays com 2-5 itens; se não houver dados, retorne itens explicando a ausência.`;

  return callGroqJson(prompt, 2500);
}

module.exports = {
  generateInsights, categorizeInstagramPosts,
  generateCampaignInsights, analyzeMentions, generateListeningSummary,
};
