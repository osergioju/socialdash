require("dotenv").config();
const prisma = require("./prisma");
const bcrypt = require("bcryptjs");

const MONTHS = [
  { key: "2025-04", label: "Abril/25" },
  { key: "2025-05", label: "Maio/25" },
  { key: "2025-06", label: "Junho/25" },
  { key: "2025-07", label: "Julho/25" },
  { key: "2025-08", label: "Agosto/25" },
  { key: "2025-09", label: "Setembro/25" },
  { key: "2025-10", label: "Outubro/25" },
  { key: "2025-11", label: "Novembro/25" },
  { key: "2025-12", label: "Dezembro/25" },
  { key: "2026-01", label: "Janeiro/26" },
];

const IG = {
  seguidores:             [1863, 1896, 1935, 1947, 1976, 1999, 2045, 2138, 2160, 2196],
  novosSeguidores:        [37, 33, 39, 12, 29, 23, 46, 93, 22, 36],
  alcanceOrganico:        [1006, 931, 1353, 918, 762, 1000, 1117, 1828, 1193, 2434],
  visualizacoes:          [5264, 4441, 8254, 10272, 7747, 10527, 15270, 25353, 10331, 9613],
  interacoes:             [193, 140, 214, 120, 153, 139, 220, 327, 128, 314],
  visitasPerfil:          [242, 305, 289, 202, 292, 351, 514, 807, 316, 481],
  postagensTotal:         [14, 11, 14, 13, 10, 13, 20, 16, 15, 15],
  reelsQtd:               [5, 3, 7, 3, 5, 6, 5, 4, 3, 10],
  reelsAlcance:           [1086, 716, 948, 451, 488, 770, 757, 1086, 776, 2158],
  reelsInteracoes:        [100, 85, 153, 46, 77, 91, 89, 177, 67, 267],
  storiesQtd:             [11, 6, 15, 33, 6, 11, 20, 7, 18, 13],
  storiesViews:           [521, 949, 2305, 5452, 1643, 2014, 2870, 1187, 2494, 2110],
  curtidasPosts:          [175, 51, 45, 68, 54, 40, 108, 124, 54, 40],
  comentariosPosts:       [9, 2, 4, 0, 0, 1, 6, 9, 0, 1],
  salvamentosPosts:       [1, 1, 2, 0, 10, 7, 4, 2, 0, 1],
  compartilhamentosPosts: [8, 1, 4, 2, 0, 0, 6, 7, 3, 0],
};

const LI = {
  seguidores:      [4717, 4759, 4805, 4831, 4879, 4919, 4994, 5015, 5017, 5057],
  novosSeguidores: [58, 61, 46, 42, 53, 48, 77, 37, 13, 30],
  alcance:         [3912, 5335, 3603, 2943, 3072, 3501, 8506, 2298, 1270, 1019],
  impressoes:      [9199, 10320, 7177, 5754, 6247, 7012, 14976, 4531, 2723, 2122],
  engajamento:     [1348, 1274, 1034, 669, 1069, 1097, 2034, 806, 417, 197],
  cliques:         [1070, 837, 764, 452, 838, 831, 1447, 675, 335, 158],
  reacoes:         [285, 427, 268, 218, 235, 268, 564, 133, 81, 54],
  postagens:       [12, 12, 11, 10, 10, 11, 14, 12, 9, 8],
};

const GA4 = {
  usuariosAtivos:        [11760, 13108, 10268, 11922, 15976, 12999, 10704, 9881, 10189, 13760],
  novosUsuarios:         [10617, 11666, 9070, 10599, 14740, 11838, 9583, 8669, 9132, 12594],
  usuariosTotais:        [11760, 13108, 10543, 12124, 16191, 13291, 11008, 10156, 10522, 14036],
  sessoes:               [15881, 17154, 14054, 15662, 20174, 17587, 14243, 13678, 13599, 17980],
  sessoesEngajadas:      [10108, 11409, 8732, 9798, 10179, 8309, 6574, 6596, 6660, 8634],
  taxaEngajamento:       [63.65, 66.51, 62.13, 62.56, 50.46, 47.25, 46.16, 48.22, 48.97, 48.02],
  tempoMedioEngajamento: [53, 54, 56, 64, 40, 39, 41, 43, 37, 39],
  tempoMedioSessao:      [null, null, 42, 49, 32, 30, 31, 32, 29, 30],
  viewsPorSessao:        [1.78, 1.74, 1.71, 1.84, 1.87, 1.56, 1.57, 1.65, 1.65, 1.72],
  numEventos:            [88888, 95978, 76719, 100347, 115454, 86269, 71714, 70980, 69611, 95809],
};

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const hashed = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@crtecosystem.com.br" },
    update: {},
    create: { email: "admin@crtecosystem.com.br", name: "Admin CRT", password: hashed, role: "ADMIN" },
  });
  console.log("✅ User created");

  // Instagram metrics
  for (let i = 0; i < MONTHS.length; i++) {
    await prisma.instagramMetric.upsert({
      where: { month: MONTHS[i].key },
      update: {},
      create: {
        month: MONTHS[i].key, monthLabel: MONTHS[i].label,
        seguidores: IG.seguidores[i], novosSeguidores: IG.novosSeguidores[i],
        alcanceOrganico: IG.alcanceOrganico[i], visualizacoes: IG.visualizacoes[i],
        interacoes: IG.interacoes[i], visitasPerfil: IG.visitasPerfil[i],
        postagensTotal: IG.postagensTotal[i], reelsQtd: IG.reelsQtd[i],
        reelsAlcance: IG.reelsAlcance[i], reelsInteracoes: IG.reelsInteracoes[i],
        storiesQtd: IG.storiesQtd[i], storiesViews: IG.storiesViews[i],
        curtidasPosts: IG.curtidasPosts[i], comentariosPosts: IG.comentariosPosts[i],
        salvamentosPosts: IG.salvamentosPosts[i], compartilhamentosPosts: IG.compartilhamentosPosts[i],
      },
    });
  }
  console.log("✅ Instagram metrics seeded");

  // LinkedIn metrics
  for (let i = 0; i < MONTHS.length; i++) {
    await prisma.linkedinMetric.upsert({
      where: { month: MONTHS[i].key },
      update: {},
      create: {
        month: MONTHS[i].key, monthLabel: MONTHS[i].label,
        seguidores: LI.seguidores[i], novosSeguidores: LI.novosSeguidores[i],
        alcance: LI.alcance[i], impressoes: LI.impressoes[i],
        engajamento: LI.engajamento[i], cliques: LI.cliques[i],
        reacoes: LI.reacoes[i], postagens: LI.postagens[i],
      },
    });
  }
  console.log("✅ LinkedIn metrics seeded");

  // GA4 metrics
  for (let i = 0; i < MONTHS.length; i++) {
    await prisma.ga4Metric.upsert({
      where: { month: MONTHS[i].key },
      update: {},
      create: {
        month: MONTHS[i].key, monthLabel: MONTHS[i].label,
        usuariosAtivos: GA4.usuariosAtivos[i], novosUsuarios: GA4.novosUsuarios[i],
        usuariosTotais: GA4.usuariosTotais[i], sessoes: GA4.sessoes[i],
        sessoesEngajadas: GA4.sessoesEngajadas[i], taxaEngajamento: GA4.taxaEngajamento[i],
        tempoMedioEngajamento: GA4.tempoMedioEngajamento[i],
        tempoMedioSessao: GA4.tempoMedioSessao[i],
        viewsPorSessao: GA4.viewsPorSessao[i], numEventos: GA4.numEventos[i],
      },
    });
  }
  console.log("✅ GA4 metrics seeded");

  // Instagram cities
  const igCities = [
    { cidade: "Bragança Paulista, SP", seg: [122,122,121,119,122,123,175,220,220,219] },
    { cidade: "Rio Branco, AC",        seg: [137,140,141,144,142,141,129,134,130,128] },
    { cidade: "Cataguases, MG",        seg: [95,91,101,103,105,108,108,107,109,110] },
    { cidade: "Campo Grande, MS",      seg: [98,99,99,97,101,100,98,102,102,101] },
    { cidade: "João Pessoa, PB",       seg: [91,97,98,93,101,99,94,103,102,106] },
    { cidade: "Cuiabá, MT",            seg: [91,93,96,94,98,98,98,97,98,100] },
  ];
  for (const c of igCities) {
    const city = await prisma.city.upsert({
      where: { name_platform: { name: c.cidade, platform: "INSTAGRAM" } },
      update: {},
      create: { name: c.cidade, platform: "INSTAGRAM" },
    });
    for (let i = 0; i < MONTHS.length; i++) {
      await prisma.cityMetric.upsert({
        where: { cityId_month: { cityId: city.id, month: MONTHS[i].key } },
        update: {},
        create: { cityId: city.id, month: MONTHS[i].key, seguidores: c.seg[i] },
      });
    }
  }
  console.log("✅ Instagram cities seeded");

  // LinkedIn regions
  const liCities = [
    { cidade: "São Paulo",         seg: [931,941,973,979,1000,1008,1034,1047,1041,1052] },
    { cidade: "Bragança Paulista", seg: [620,621,627,628,629,627,628,625,625,623] },
    { cidade: "Rio de Janeiro",    seg: [479,482,483,486,482,486,494,491,491,495] },
    { cidade: "Brasília",          seg: [364,367,364,362,373,376,386,394,393,398] },
    { cidade: "Belo Horizonte",    seg: [211,213,215,220,218,220,225,229,229,231] },
  ];
  for (const c of liCities) {
    const city = await prisma.city.upsert({
      where: { name_platform: { name: c.cidade, platform: "LINKEDIN" } },
      update: {},
      create: { name: c.cidade, platform: "LINKEDIN" },
    });
    for (let i = 0; i < MONTHS.length; i++) {
      await prisma.cityMetric.upsert({
        where: { cityId_month: { cityId: city.id, month: MONTHS[i].key } },
        update: {},
        create: { cityId: city.id, month: MONTHS[i].key, seguidores: c.seg[i] },
      });
    }
  }
  console.log("✅ LinkedIn regions seeded");

  // Instagram themes
  const igThemes = [
    { tema: "IPCA / Inflação",         curtidas: 315, comentarios: 32, compartilhamentos: 34, alcanceMedio: 390, icon: "📊" },
    { tema: "Rentabilidade / Resultados", curtidas: 195, comentarios: 13, compartilhamentos: 24, alcanceMedio: 380, icon: "📈" },
    { tema: "Longevidade / Saúde",     curtidas: 120, comentarios: 18, compartilhamentos: 14, alcanceMedio: 220, icon: "🧘" },
    { tema: "Institucional / Eventos", curtidas: 85,  comentarios: 4,  compartilhamentos: 8,  alcanceMedio: 155, icon: "🏢" },
    { tema: "Educação Financeira",     curtidas: 78,  comentarios: 6,  compartilhamentos: 5,  alcanceMedio: 105, icon: "💡" },
    { tema: "Governança / Eleições",   curtidas: 42,  comentarios: 2,  compartilhamentos: 1,  alcanceMedio: 110, icon: "🗳️" },
  ];
  for (const t of igThemes) {
    await prisma.theme.upsert({
      where: { id: (await prisma.theme.findFirst({ where: { tema: t.tema, platform: "INSTAGRAM" } }))?.id ?? "new" },
      update: t,
      create: { ...t, platform: "INSTAGRAM" },
    });
  }
  console.log("✅ Instagram themes seeded");

  // LinkedIn themes
  const liThemes = [
    { tema: "Eventos / Congressos",    engajamento: 4200, cliques: 890, alcanceMedio: 950, icon: "🎤" },
    { tema: "Governança / Conselhos",  engajamento: 3100, cliques: 420, alcanceMedio: 450, icon: "⚖️" },
    { tema: "Dados que Falam",         engajamento: 2800, cliques: 680, alcanceMedio: 320, icon: "📊" },
    { tema: "Benefícios / Produtos",   engajamento: 1900, cliques: 350, alcanceMedio: 250, icon: "🎯" },
    { tema: "Longevidade / ESG",       engajamento: 1200, cliques: 180, alcanceMedio: 190, icon: "🌱" },
  ];
  for (const t of liThemes) {
    await prisma.theme.upsert({
      where: { id: (await prisma.theme.findFirst({ where: { tema: t.tema, platform: "LINKEDIN" } }))?.id ?? "new" },
      update: t,
      create: { ...t, platform: "LINKEDIN" },
    });
  }
  console.log("✅ LinkedIn themes seeded");

  // LinkedIn industries
  const industries = [
    { nome: "Serviços Públicos", seguidores: 436 },
    { nome: "Seguros", seguidores: 340 },
    { nome: "Gestão de Investimentos", seguidores: 316 },
    { nome: "Org. Sem Fins Lucrativos", seguidores: 302 },
    { nome: "Serviços Financeiros", seguidores: 295 },
  ];
  for (const ind of industries) {
    await prisma.linkedinIndustry.upsert({
      where: { nome: ind.nome },
      update: { seguidores: ind.seguidores },
      create: ind,
    });
  }
  console.log("✅ LinkedIn industries seeded");

  // LinkedIn roles
  const roles = [
    { nome: "Financeiro", seguidores: 606 },
    { nome: "Operações", seguidores: 547 },
    { nome: "Desenv. de Negócios", seguidores: 421 },
    { nome: "Administração", seguidores: 323 },
    { nome: "Vendas", seguidores: 266 },
  ];
  for (const r of roles) {
    await prisma.linkedinRole.upsert({
      where: { nome: r.nome },
      update: { seguidores: r.seguidores },
      create: r,
    });
  }
  console.log("✅ LinkedIn roles seeded");

  // GA4 pages
  const pages = [
    { pagina: "/",              label: "Home",         views: [5870,5803,7083,5696,6728,6582,6531,8329,6963,8352], tempoMedio: [25,29,28,40,32,29,32,25,28,22] },
    { pagina: "/emprestimo/",   label: "Empréstimo",   views: [6025,8198,5839,6216,5874,3853,1523,1248,1448,1801], tempoMedio: [55,53,54,52,51,54,56,54,55,53] },
    { pagina: "/simulador/",    label: "Simulador",    views: [1921,2226,1962,2316,1842,1426,1116,1070,1264,1515], tempoMedio: [50,50,51,54,46,48,53,52,53,51] },
    { pagina: "/investimentos/",label: "Investimentos",views: [1515,695,1398,1320,1305,1349,null,null,null,null],  tempoMedio: [51,54,47,84,62,45,null,null,null,null] },
    { pagina: "/adesao/",       label: "Adesão",       views: [1063,1259,1108,1251,1544,1176,889,608,654,null],   tempoMedio: [41,48,47,37,49,29,57,53,54,null] },
  ];
  for (const p of pages) {
    const page = await prisma.ga4Page.upsert({
      where: { pagina: p.pagina },
      update: { label: p.label },
      create: { pagina: p.pagina, label: p.label },
    });
    for (let i = 0; i < MONTHS.length; i++) {
      if (p.views[i] != null) {
        await prisma.ga4PageMetric.upsert({
          where: { pageId_month: { pageId: page.id, month: MONTHS[i].key } },
          update: {},
          create: { pageId: page.id, month: MONTHS[i].key, views: p.views[i], tempoMedio: p.tempoMedio[i] },
        });
      }
    }
  }
  console.log("✅ GA4 pages seeded");

  // GA4 origins
  const origins = [
    { fonte: "Google Orgânico",        sessoes: [7614,9591,7064,7421,6898,5104,3274,3182,3477,4005], taxaEng: [77.9,77.65,76.4,76.78,75.98,71.88,73.21,74.07,73.74,75.28], tempoMedio: [68,64,68,69,64,69,75,73,70,67] },
    { fonte: "Direto",                 sessoes: [6902,6375,5656,7034,12246,10907,9492,8838,8355,11768], taxaEng: [51.42,48.3,46.73,47.84,33.29,34.67,33.88,37.04,36.31,36.54], tempoMedio: [30,35,37,45,22,21,22,22,22,19] },
    { fonte: "Bing Orgânico",          sessoes: [281,413,350,309,261,345,332,290,312,365], taxaEng: [66.55,71.67,71.43,73.79,72.41,65.51,67.17,75.86,75.64,73.97], tempoMedio: [73,74,60,78,78,74,65,90,69,59] },
    { fonte: "Simulador (referral)",   sessoes: [371,383,426,486,474,351,332,408,289,null], taxaEng: [57.14,55.35,46.95,52.88,53.59,47.86,57.83,51.47,60.55,null], tempoMedio: [57,57,56,71,78,55,86,44,59,null] },
    { fonte: "Conecta Energisa",       sessoes: [null,null,null,null,null,null,533,371,402,404], taxaEng: [null,null,null,null,null,null,71.67,73.32,75.12,77.23], tempoMedio: [null,null,null,null,null,null,53,60,52,55] },
  ];
  for (const o of origins) {
    const origin = await prisma.ga4Origin.upsert({
      where: { fonte: o.fonte },
      update: {},
      create: { fonte: o.fonte },
    });
    for (let i = 0; i < MONTHS.length; i++) {
      if (o.sessoes[i] != null) {
        await prisma.ga4OriginMetric.upsert({
          where: { originId_month: { originId: origin.id, month: MONTHS[i].key } },
          update: {},
          create: { originId: origin.id, month: MONTHS[i].key, sessoes: o.sessoes[i], taxaEng: o.taxaEng[i], tempoMedio: o.tempoMedio[i] },
        });
      }
    }
  }
  console.log("✅ GA4 origins seeded");

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
