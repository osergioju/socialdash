const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

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

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.35, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const body = await res.json();
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Strip accidental markdown fences
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(clean);
}

module.exports = { generateInsights };
