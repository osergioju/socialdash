import { useState } from "react";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Legend, PieChart, Pie } from "recharts";
import { TrendingUp, TrendingDown, Users, Eye, Heart, MessageCircle, Share2, Bookmark, BarChart3, Globe, Activity, Target, Zap, Award, ArrowUpRight, ArrowDownRight, Layers, Video, Image, Layout, MousePointerClick, MapPin, FileText, Link2, Clock, Monitor } from "lucide-react";

const MONTHS = ["Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez", "Jan"];
const MONTHS_FULL = ["Abril/25", "Maio/25", "Junho/25", "Julho/25", "Agosto/25", "Setembro/25", "Outubro/25", "Novembro/25", "Dezembro/25", "Janeiro/26"];

// ===== INSTAGRAM =====
const IG = {
    seguidores: [1863, 1896, 1935, 1947, 1976, 1999, 2045, 2138, 2160, 2196],
    novosSeguidores: [37, 33, 39, 12, 29, 23, 46, 93, 22, 36],
    alcanceOrganico: [1006, 931, 1353, 918, 762, 1000, 1117, 1828, 1193, 2434],
    visualizacoes: [5264, 4441, 8254, 10272, 7747, 10527, 15270, 25353, 10331, 9613],
    interacoes: [193, 140, 214, 120, 153, 139, 220, 327, 128, 314],
    visitasPerfil: [242, 305, 289, 202, 292, 351, 514, 807, 316, 481],
    postagensTotal: [14, 11, 14, 13, 10, 13, 20, 16, 15, 15],
    reelsQtd: [5, 3, 7, 3, 5, 6, 5, 4, 3, 10],
    reelsAlcance: [1086, 716, 948, 451, 488, 770, 757, 1086, 776, 2158],
    reelsInteracoes: [100, 85, 153, 46, 77, 91, 89, 177, 67, 267],
    storiesQtd: [11, 6, 15, 33, 6, 11, 20, 7, 18, 13],
    storiesViews: [521, 949, 2305, 5452, 1643, 2014, 2870, 1187, 2494, 2110],
    curtidasPosts: [175, 51, 45, 68, 54, 40, 108, 124, 54, 40],
    comentariosPosts: [9, 2, 4, 0, 0, 1, 6, 9, 0, 1],
    salvamentosPosts: [1, 1, 2, 0, 10, 7, 4, 2, 0, 1],
    compartilhamentosPosts: [8, 1, 4, 2, 0, 0, 6, 7, 3, 0],
    cidades: [
        { cidade: "Bragança Paulista, SP", seg: [122, 122, 121, 119, 122, 123, 175, 220, 220, 219] },
        { cidade: "Rio Branco, AC", seg: [137, 140, 141, 144, 142, 141, 129, 134, 130, 128] },
        { cidade: "Cataguases, MG", seg: [95, 91, 101, 103, 105, 108, 108, 107, 109, 110] },
        { cidade: "Campo Grande, MS", seg: [98, 99, 99, 97, 101, 100, 98, 102, 102, 101] },
        { cidade: "João Pessoa, PB", seg: [91, 97, 98, 93, 101, 99, 94, 103, 102, 106] },
        { cidade: "Cuiabá, MT", seg: [91, 93, 96, 94, 98, 98, 98, 97, 98, 100] },
    ],
};

// ===== LINKEDIN =====
const LI = {
    seguidores: [4717, 4759, 4805, 4831, 4879, 4919, 4994, 5015, 5017, 5057],
    novosSeguidores: [58, 61, 46, 42, 53, 48, 77, 37, 13, 30],
    alcance: [3912, 5335, 3603, 2943, 3072, 3501, 8506, 2298, 1270, 1019],
    impressoes: [9199, 10320, 7177, 5754, 6247, 7012, 14976, 4531, 2723, 2122],
    engajamento: [1348, 1274, 1034, 669, 1069, 1097, 2034, 806, 417, 197],
    cliques: [1070, 837, 764, 452, 838, 831, 1447, 675, 335, 158],
    reacoes: [285, 427, 268, 218, 235, 268, 564, 133, 81, 54],
    postagens: [12, 12, 11, 10, 10, 11, 14, 12, 9, 8],
    regioes: [
        { cidade: "São Paulo", seg: [931, 941, 973, 979, 1000, 1008, 1034, 1047, 1041, 1052] },
        { cidade: "Bragança Paulista", seg: [620, 621, 627, 628, 629, 627, 628, 625, 625, 623] },
        { cidade: "Rio de Janeiro", seg: [479, 482, 483, 486, 482, 486, 494, 491, 491, 495] },
        { cidade: "Brasília", seg: [364, 367, 364, 362, 373, 376, 386, 394, 393, 398] },
        { cidade: "Belo Horizonte", seg: [211, 213, 215, 220, 218, 220, 225, 229, 229, 231] },
    ],
    industrias: [
        { nome: "Serviços Públicos", seg: 436 },
        { nome: "Seguros", seg: 340 },
        { nome: "Gestão de Investimentos", seg: 316 },
        { nome: "Org. Sem Fins Lucrativos", seg: 302 },
        { nome: "Serviços Financeiros", seg: 295 },
    ],
    funcoes: [
        { nome: "Financeiro", seg: 606 },
        { nome: "Operações", seg: 547 },
        { nome: "Desenv. de Negócios", seg: 421 },
        { nome: "Administração", seg: 323 },
        { nome: "Vendas", seg: 266 },
    ],
};

// ===== GA4 =====
const GA4 = {
    usuariosAtivos: [11760, 13108, 10268, 11922, 15976, 12999, 10704, 9881, 10189, 13760],
    novosUsuarios: [10617, 11666, 9070, 10599, 14740, 11838, 9583, 8669, 9132, 12594],
    usuariosTotais: [11760, 13108, 10543, 12124, 16191, 13291, 11008, 10156, 10522, 14036],
    sessoes: [15881, 17154, 14054, 15662, 20174, 17587, 14243, 13678, 13599, 17980],
    sessoesEngajadas: [10108, 11409, 8732, 9798, 10179, 8309, 6574, 6596, 6660, 8634],
    taxaEngajamento: [63.65, 66.51, 62.13, 62.56, 50.46, 47.25, 46.16, 48.22, 48.97, 48.02],
    tempoMedioEngajamento: [53, 54, 56, 64, 40, 39, 41, 43, 37, 39],
    tempoMedioSessao: [null, null, 42, 49, 32, 30, 31, 32, 29, 30],
    viewsPorSessao: [1.78, 1.74, 1.71, 1.84, 1.87, 1.56, 1.57, 1.65, 1.65, 1.72],
    numEventos: [88888, 95978, 76719, 100347, 115454, 86269, 71714, 70980, 69611, 95809],
    paginas: [
        { pagina: "/", label: "Home", views: [5870, 5803, 7083, 5696, 6728, 6582, 6531, 8329, 6963, 8352], tempoMedio: [25, 29, 28, 40, 32, 29, 32, 25, 28, 22] },
        { pagina: "/emprestimo/", label: "Empréstimo", views: [6025, 8198, 5839, 6216, 5874, 3853, 1523, 1248, 1448, 1801], tempoMedio: [55, 53, 54, 52, 51, 54, 56, 54, 55, 53] },
        { pagina: "/simulador/", label: "Simulador", views: [1921, 2226, 1962, 2316, 1842, 1426, 1116, 1070, 1264, 1515], tempoMedio: [50, 50, 51, 54, 46, 48, 53, 52, 53, 51] },
        { pagina: "/investimentos/", label: "Investimentos", views: [1515, 695, 1398, 1320, 1305, 1349, null, null, null, null], tempoMedio: [51, 54, 47, 84, 62, 45, null, null, null, null] },
        { pagina: "/adesao/", label: "Adesão", views: [1063, 1259, 1108, 1251, 1544, 1176, 889, 608, 654, null], tempoMedio: [41, 48, 47, 37, 49, 29, 57, 53, 54, null] },
    ],
    origens: [
        { fonte: "Google Orgânico", sessoes: [7614, 9591, 7064, 7421, 6898, 5104, 3274, 3182, 3477, 4005], taxaEng: [77.9, 77.65, 76.4, 76.78, 75.98, 71.88, 73.21, 74.07, 73.74, 75.28], tempoMedio: [68, 64, 68, 69, 64, 69, 75, 73, 70, 67] },
        { fonte: "Direto", sessoes: [6902, 6375, 5656, 7034, 12246, 10907, 9492, 8838, 8355, 11768], taxaEng: [51.42, 48.3, 46.73, 47.84, 33.29, 34.67, 33.88, 37.04, 36.31, 36.54], tempoMedio: [30, 35, 37, 45, 22, 21, 22, 22, 22, 19] },
        { fonte: "Bing Orgânico", sessoes: [281, 413, 350, 309, 261, 345, 332, 290, 312, 365], taxaEng: [66.55, 71.67, 71.43, 73.79, 72.41, 65.51, 67.17, 75.86, 75.64, 73.97], tempoMedio: [73, 74, 60, 78, 78, 74, 65, 90, 69, 59] },
        { fonte: "Simulador (referral)", sessoes: [371, 383, 426, 486, 474, 351, 332, 408, 289, null], taxaEng: [57.14, 55.35, 46.95, 52.88, 53.59, 47.86, 57.83, 51.47, 60.55, null], tempoMedio: [57, 57, 56, 71, 78, 55, 86, 44, 59, null] },
        { fonte: "Conecta Energisa", sessoes: [null, null, null, null, null, null, 533, 371, 402, 404], taxaEng: [null, null, null, null, null, null, 71.67, 73.32, 75.12, 77.23], tempoMedio: [null, null, null, null, null, null, 53, 60, 52, 55] },
    ],
};

const TOP_THEMES_IG = [
    { tema: "IPCA / Inflação", curtidas: 315, comentarios: 32, compartilhamentos: 34, alcanceMedio: 390, icon: "📊" },
    { tema: "Rentabilidade / Resultados", curtidas: 195, comentarios: 13, compartilhamentos: 24, alcanceMedio: 380, icon: "📈" },
    { tema: "Longevidade / Saúde", curtidas: 120, comentarios: 18, compartilhamentos: 14, alcanceMedio: 220, icon: "🧘" },
    { tema: "Institucional / Eventos", curtidas: 85, comentarios: 4, compartilhamentos: 8, alcanceMedio: 155, icon: "🏢" },
    { tema: "Educação Financeira", curtidas: 78, comentarios: 6, compartilhamentos: 5, alcanceMedio: 105, icon: "💡" },
    { tema: "Governança / Eleições", curtidas: 42, comentarios: 2, compartilhamentos: 1, alcanceMedio: 110, icon: "🗳️" },
];

const TOP_THEMES_LI = [
    { tema: "Eventos / Congressos", engajamento: 4200, cliques: 890, alcanceMedio: 950, icon: "🎤" },
    { tema: "Governança / Conselhos", engajamento: 3100, cliques: 420, alcanceMedio: 450, icon: "⚖️" },
    { tema: "Dados que Falam", engajamento: 2800, cliques: 680, alcanceMedio: 320, icon: "📊" },
    { tema: "Benefícios / Produtos", engajamento: 1900, cliques: 350, alcanceMedio: 250, icon: "🎯" },
    { tema: "Longevidade / ESG", engajamento: 1200, cliques: 180, alcanceMedio: 190, icon: "🌱" },
];

const C = {
    primary: "#0D9488", primaryLight: "#14B8A6", primaryDark: "#0F766E",
    accent: "#F59E0B", accentLight: "#FBBF24",
    instagram: "#E1306C", instagramLight: "#F77FB0",
    linkedin: "#0A66C2", linkedinLight: "#5BA3E6",
    ga4: "#4285F4", ga4Light: "#7BAAF7",
    green: "#10B981", red: "#EF4444", orange: "#F97316", purple: "#8B5CF6", cyan: "#06B6D4",
    bg: "#0B1120", card: "#111827", cardHover: "#1F2937",
    border: "#1E293B", text: "#E2E8F0", textMuted: "#94A3B8", textDim: "#64748B",
};

function calcVar(arr, i) { if (i === 0 || arr[i] == null || arr[i - 1] == null) return null; return (((arr[i] - arr[i - 1]) / arr[i - 1]) * 100).toFixed(1); }
function fmt(n) { if (n == null) return "—"; if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"; if (n >= 1000) return (n / 1000).toFixed(1) + "k"; return n.toString(); }

function MetricCard({ title, value, variation, icon: Icon, color, subtitle, small }) {
    const isPos = parseFloat(variation) > 0;
    return (
        <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.cardHover} 100%)`, border: `1px solid ${C.border}`, borderRadius: 14, padding: small ? "14px 16px" : "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: color, opacity: 0.06 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <div style={{ background: color + "20", borderRadius: 7, padding: 5, display: "flex" }}><Icon size={small ? 13 : 15} color={color} /></div>
                <span style={{ color: C.textMuted, fontSize: small ? 10 : 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
            </div>
            <div style={{ fontSize: small ? 20 : 26, fontWeight: 700, color: C.text, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.1 }}>{value}</div>
            {variation !== null && variation !== undefined && (
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 5 }}>
                    {isPos ? <ArrowUpRight size={12} color={C.green} /> : <ArrowDownRight size={12} color={C.red} />}
                    <span style={{ fontSize: 11, fontWeight: 600, color: isPos ? C.green : C.red }}>{isPos ? "+" : ""}{variation}%</span>
                    <span style={{ fontSize: 10, color: C.textDim }}>{subtitle || "vs anterior"}</span>
                </div>
            )}
        </div>
    );
}

function SectionHeader({ icon: Icon, title, subtitle, color }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, marginTop: 40 }}>
            <div style={{ background: `linear-gradient(135deg, ${color}30, ${color}10)`, border: `1px solid ${color}40`, borderRadius: 12, padding: 10, display: "flex" }}><Icon size={20} color={color} /></div>
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
                {subtitle && <p style={{ fontSize: 12, color: C.textMuted, margin: 0, marginTop: 2 }}>{subtitle}</p>}
            </div>
        </div>
    );
}

function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                <p style={{ margin: 0, fontSize: 11, color: C.textMuted, marginBottom: 6 }}>{label}</p>
                {payload.filter(p => p.value != null).map((p, i) => (
                    <p key={i} style={{ margin: "2px 0", fontSize: 12, fontWeight: 600, color: p.color || C.text }}>
                        {p.name}: {typeof p.value === "number" ? (p.value > 999 ? fmt(p.value) : p.value) : p.value}{p.unit || ""}
                    </p>
                ))}
            </div>
        );
    }
    return null;
}

function ThemeRankCard({ themes, platform }) {
    const maxVal = Math.max(...themes.map(t => platform === "ig" ? t.curtidas : t.engajamento));
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {themes.map((t, i) => {
                const val = platform === "ig" ? t.curtidas : t.engajamento;
                return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{t.icon}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{t.tema}</span>
                                <span style={{ fontSize: 11, color: C.textMuted }}>{fmt(val)}</span>
                            </div>
                            <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${(val / maxVal) * 100}%`, background: `linear-gradient(90deg, ${platform === "ig" ? C.instagram : C.linkedin}, ${platform === "ig" ? C.instagramLight : C.linkedinLight})`, borderRadius: 3 }} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function DataTable({ headers, rows, colors }) {
    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                    <tr>{headers.map((h, i) => <th key={i} style={{ padding: "10px 12px", textAlign: i === 0 ? "left" : "right", color: C.textMuted, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: `1px solid ${C.border}22` }}>
                            {row.map((cell, ci) => (
                                <td key={ci} style={{ padding: "10px 12px", textAlign: ci === 0 ? "left" : "right", color: ci === 0 ? C.text : C.textMuted, fontWeight: ci === 0 ? 600 : 400, fontFamily: ci > 0 ? "'JetBrains Mono', monospace" : "inherit", whiteSpace: "nowrap" }}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function CityChart({ data, color, monthIdx }) {
    const chartData = data.map(c => ({ cidade: c.cidade.split(",")[0], seguidores: c.seg[monthIdx] || c.seg[c.seg.length - 1] })).sort((a, b) => b.seguidores - a.seguidores);
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="cidade" tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="seguidores" fill={color} radius={[0, 6, 6, 0]} name="Seguidores">
                    {chartData.map((_, i) => <Cell key={i} fill={i === 0 ? color : color + "80"} />)}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export default function Dashboard() {
    const [tab, setTab] = useState("overview");
    const [mi, setMi] = useState(9);

    const igData = MONTHS.map((m, i) => ({ mes: m, seguidores: IG.seguidores[i], alcance: IG.alcanceOrganico[i], visualizacoes: IG.visualizacoes[i], interacoes: IG.interacoes[i], reelsAlcance: IG.reelsAlcance[i], reelsInteracoes: IG.reelsInteracoes[i], storiesViews: IG.storiesViews[i], visitasPerfil: IG.visitasPerfil[i], postagens: IG.postagensTotal[i], reelsQtd: IG.reelsQtd[i], storiesQtd: IG.storiesQtd[i], novos: IG.novosSeguidores[i] }));
    const liData = MONTHS.map((m, i) => ({ mes: m, seguidores: LI.seguidores[i], alcance: LI.alcance[i], impressoes: LI.impressoes[i], engajamento: LI.engajamento[i], cliques: LI.cliques[i], reacoes: LI.reacoes[i], postagens: LI.postagens[i], novos: LI.novosSeguidores[i] }));
    const ga4Data = MONTHS.map((m, i) => ({ mes: m, usuarios: GA4.usuariosAtivos[i], novos: GA4.novosUsuarios[i], sessoes: GA4.sessoes[i], engajadas: GA4.sessoesEngajadas[i], taxaEng: GA4.taxaEngajamento[i], tempoMedio: GA4.tempoMedioEngajamento[i], eventos: GA4.numEventos[i], viewsPorSessao: GA4.viewsPorSessao[i], totais: GA4.usuariosTotais[i] }));
    const compData = MONTHS.map((m, i) => ({ mes: m, igSeg: IG.seguidores[i], liSeg: LI.seguidores[i], igAlc: IG.alcanceOrganico[i], liAlc: LI.alcance[i], siteUs: GA4.usuariosAtivos[i] }));

    const tabs = [
        { id: "overview", label: "Visão Geral", icon: BarChart3 },
        { id: "instagram", label: "Instagram", icon: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" /></svg> },
        { id: "linkedin", label: "LinkedIn", icon: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg> },
        { id: "site", label: "Site (GA4)", icon: Globe },
        { id: "temas", label: "Temas & Conteúdo", icon: Layers },
    ];

    const igTotalSeg = IG.seguidores[9] - IG.seguidores[0];
    const liTotalSeg = LI.seguidores[9] - LI.seguidores[0];
    const totalViews = IG.visualizacoes.reduce((a, b) => a + b, 0);

    const MonthSelector = ({ color }) => (
        <div style={{ display: "flex", gap: 5, marginBottom: 22, overflowX: "auto", paddingBottom: 4 }}>
            {MONTHS_FULL.map((m, i) => (
                <button key={i} onClick={() => setMi(i)} style={{ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap", background: mi === i ? color + "25" : C.card, color: mi === i ? color : C.textMuted, outline: mi === i ? `1px solid ${color}50` : `1px solid ${C.border}` }}>{m}</button>
            ))}
        </div>
    );

    // ===== PAGES TABLE DATA =====
    const paginasRows = GA4.paginas.map(p => {
        const v = p.views[mi];
        const t = p.tempoMedio[mi];
        return [p.label, v != null ? fmt(v) : "—", t != null ? t + "s" : "—"];
    });

    // ===== ORIGENS TABLE DATA =====
    const origensRows = GA4.origens.map(o => {
        const s = o.sessoes[mi];
        const te = o.taxaEng[mi];
        const tm = o.tempoMedio[mi];
        return [o.fonte, s != null ? fmt(s) : "—", te != null ? te + "%" : "—", tm != null ? tm + "s" : "—"];
    }).filter(r => r[1] !== "—");

    return (
        <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'DM Sans', -apple-system, sans-serif", padding: "0 0 60px" }}>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />

            {/* HEADER */}
            <div style={{ background: `linear-gradient(135deg, ${C.primaryDark}15 0%, ${C.bg} 50%, ${C.linkedin}08 100%)`, borderBottom: `1px solid ${C.border}`, padding: "28px 24px 16px" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, color: "#fff" }}>E</div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", background: `linear-gradient(135deg, ${C.text}, ${C.primaryLight})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>EnergisaPrev</h1>
                            <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>Dashboard de Mídias Sociais — Abril/2025 a Janeiro/2026</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 3, marginTop: 16, overflowX: "auto", paddingBottom: 4 }}>
                        {tabs.map(t => {
                            const Icon = t.icon;
                            const isA = tab === t.id;
                            return (
                                <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.2s", background: isA ? C.primary + "22" : "transparent", color: isA ? C.primaryLight : C.textMuted, outline: isA ? `1px solid ${C.primary}40` : "1px solid transparent" }}>
                                    <Icon size={15} />{t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px" }}>

                {/* ========== VISÃO GERAL ========== */}
                {tab === "overview" && (<>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
                        <MetricCard title="Seg. Instagram" value={IG.seguidores[9].toLocaleString()} variation={((igTotalSeg / IG.seguidores[0]) * 100).toFixed(1)} icon={Users} color={C.instagram} subtitle="10 meses" />
                        <MetricCard title="Seg. LinkedIn" value={LI.seguidores[9].toLocaleString()} variation={((liTotalSeg / LI.seguidores[0]) * 100).toFixed(1)} icon={Users} color={C.linkedin} subtitle="10 meses" />
                        <MetricCard title="Views IG Total" value={fmt(totalViews)} variation={calcVar(IG.visualizacoes, 9)} icon={Eye} color={C.purple} />
                        <MetricCard title="Usuários Site" value={fmt(GA4.usuariosAtivos[9])} variation={calcVar(GA4.usuariosAtivos, 9)} icon={Globe} color={C.ga4} />
                        <MetricCard title="Alcance IG" value={fmt(IG.alcanceOrganico[9])} variation={calcVar(IG.alcanceOrganico, 9)} icon={Eye} color={C.green} />
                        <MetricCard title="Engaj. LI" value={fmt(LI.engajamento[9])} variation={calcVar(LI.engajamento, 9)} icon={Heart} color={C.orange} />
                    </div>

                    <SectionHeader icon={Users} title="Evolução de Seguidores" subtitle="Crescimento comparativo Instagram vs LinkedIn" color={C.primary} />
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
                        <ResponsiveContainer width="100%" height={280}>
                            <ComposedChart data={compData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                                <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="ig" orientation="left" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[1800, 2300]} />
                                <YAxis yAxisId="li" orientation="right" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[4600, 5100]} />
                                <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line yAxisId="ig" type="monotone" dataKey="igSeg" stroke={C.instagram} strokeWidth={3} dot={{ r: 4, fill: C.instagram }} name="Instagram" />
                                <Line yAxisId="li" type="monotone" dataKey="liSeg" stroke={C.linkedin} strokeWidth={3} dot={{ r: 4, fill: C.linkedin }} name="LinkedIn" />
                            </ComposedChart>
                        </ResponsiveContainer>
                        <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 10 }}>
                            <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: C.textMuted }}>Instagram</div><div style={{ fontSize: 17, fontWeight: 700, color: C.instagram }}>+{igTotalSeg} <span style={{ fontSize: 11 }}>({((igTotalSeg / IG.seguidores[0]) * 100).toFixed(1)}%)</span></div></div>
                            <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: C.textMuted }}>LinkedIn</div><div style={{ fontSize: 17, fontWeight: 700, color: C.linkedin }}>+{liTotalSeg} <span style={{ fontSize: 11 }}>({((liTotalSeg / LI.seguidores[0]) * 100).toFixed(1)}%)</span></div></div>
                        </div>
                    </div>

                    <SectionHeader icon={Eye} title="Alcance por Canal" subtitle="Volumetria mensal — Instagram vs LinkedIn" color={C.accent} />
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={compData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
                                <Bar dataKey="igAlc" fill={C.instagram} name="Instagram" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="liAlc" fill={C.linkedin} name="LinkedIn" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <SectionHeader icon={Globe} title="Tráfego do Site" subtitle="Usuários ativos e sessões mensais" color={C.ga4} />
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={ga4Data}>
                                <defs><linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.ga4} stopOpacity={0.2} /><stop offset="100%" stopColor={C.ga4} stopOpacity={0} /></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
                                <Area type="monotone" dataKey="usuarios" stroke={C.ga4} strokeWidth={2.5} fill="url(#gS)" name="Usuários Ativos" />
                                <Area type="monotone" dataKey="sessoes" stroke={C.green} strokeWidth={2} fill={C.green + "10"} name="Sessões" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </>)}

                {/* ========== INSTAGRAM ========== */}
                {tab === "instagram" && (<>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 20 }}>
                        <MetricCard title="Seguidores" value={IG.seguidores[mi].toLocaleString()} variation={calcVar(IG.seguidores, mi)} icon={Users} color={C.instagram} small />
                        <MetricCard title="Alcance Orgânico" value={fmt(IG.alcanceOrganico[mi])} variation={calcVar(IG.alcanceOrganico, mi)} icon={Eye} color={C.green} small />
                        <MetricCard title="Visualizações" value={fmt(IG.visualizacoes[mi])} variation={calcVar(IG.visualizacoes, mi)} icon={Activity} color={C.purple} small />
                        <MetricCard title="Interações" value={IG.interacoes[mi].toString()} variation={calcVar(IG.interacoes, mi)} icon={Heart} color={C.accent} small />
                        <MetricCard title="Visitas Perfil" value={IG.visitasPerfil[mi].toString()} variation={calcVar(IG.visitasPerfil, mi)} icon={MousePointerClick} color={C.primaryLight} small />
                        <MetricCard title="Reels Interações" value={IG.reelsInteracoes[mi].toString()} variation={calcVar(IG.reelsInteracoes, mi)} icon={Video} color={C.red} small />
                    </div>
                    <MonthSelector color={C.instagram} />

                    <SectionHeader icon={Eye} title="Alcance & Visualizações" subtitle="Evolução orgânica mensal" color={C.instagram} />
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
                        <ResponsiveContainer width="100%" height={260}>
                            <ComposedChart data={igData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="l" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="r" orientation="right" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
                                <Bar yAxisId="r" dataKey="visualizacoes" fill={C.instagram + "35"} name="Visualizações" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="l" type="monotone" dataKey="alcance" stroke={C.instagramLight} strokeWidth={3} dot={{ r: 4, fill: C.instagramLight }} name="Alcance Orgânico" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    <SectionHeader icon={Video} title="Reels & Volume de Conteúdo" subtitle="Quantidade, alcance e interações" color={C.red} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
                            <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Reels: Alcance vs Interações</h4>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={igData} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="reelsAlcance" fill={C.instagram} name="Alcance" radius={[3, 3, 0, 0]} /><Bar dataKey="reelsInteracoes" fill={C.accent} name="Interações" radius={[3, 3, 0, 0]} /></BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
                            <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Volume Mensal (Feed + Reels + Stories)</h4>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={igData}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="postagens" stackId="a" fill={C.primaryLight} name="Feed" /><Bar dataKey="reelsQtd" stackId="a" fill={C.instagram} name="Reels" /><Bar dataKey="storiesQtd" stackId="a" fill={C.accent} name="Stories" /></BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 🆕 CIDADES INSTAGRAM */}
                    <SectionHeader icon={MapPin} title="Cidades com Maior Nº de Seguidores" subtitle={`Distribuição geográfica — ${MONTHS_FULL[mi]}`} color={C.instagramLight} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
                            <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Ranking por Cidade</h4>
                            <CityChart data={IG.cidades} color={C.instagram} monthIdx={mi} />
                        </div>
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
                            <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Evolução por Cidade (10 meses)</h4>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={MONTHS.map((m, i) => { const d = { mes: m }; IG.cidades.forEach(c => { d[c.cidade.split(",")[0]] = c.seg[i]; }); return d; })}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 9 }} />
                                    {IG.cidades.map((c, i) => <Line key={i} type="monotone" dataKey={c.cidade.split(",")[0]} stroke={[C.instagram, C.accent, C.green, C.purple, C.cyan, C.orange][i]} strokeWidth={2} dot={{ r: 2 }} />)}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <SectionHeader icon={TrendingUp} title="Crescimento de Seguidores" subtitle="Novos seguidores mês a mês" color={C.green} />
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
                        <ResponsiveContainer width="100%" height={220}>
                            <ComposedChart data={igData}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis yAxisId="n" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis yAxisId="t" orientation="right" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[1800, 2300]} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar yAxisId="n" dataKey="novos" fill={C.green} name="Novos" radius={[4, 4, 0, 0]}>{igData.map((_, i) => <Cell key={i} fill={i === mi ? C.green : C.green + "55"} />)}</Bar><Line yAxisId="t" type="monotone" dataKey="seguidores" stroke={C.instagram} strokeWidth={2.5} dot={{ r: 3, fill: C.instagram }} name="Total" /></ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </>)}

                {/* ========== LINKEDIN ========== */}
                {tab === "linkedin" && (<>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 20 }}>
                        <MetricCard title="Seguidores" value={LI.seguidores[mi].toLocaleString()} variation={calcVar(LI.seguidores, mi)} icon={Users} color={C.linkedin} small />
                        <MetricCard title="Alcance" value={fmt(LI.alcance[mi])} variation={calcVar(LI.alcance, mi)} icon={Eye} color={C.green} small />
                        <MetricCard title="Impressões" value={fmt(LI.impressoes[mi])} variation={calcVar(LI.impressoes, mi)} icon={Activity} color={C.purple} small />
                        <MetricCard title="Engajamento" value={fmt(LI.engajamento[mi])} variation={calcVar(LI.engajamento, mi)} icon={Heart} color={C.accent} small />
                        <MetricCard title="Cliques" value={fmt(LI.cliques[mi])} variation={calcVar(LI.cliques, mi)} icon={MousePointerClick} color={C.primaryLight} small />
                        <MetricCard title="Reações" value={LI.reacoes[mi].toString()} variation={calcVar(LI.reacoes, mi)} icon={Zap} color={C.orange} small />
                    </div>
                    <MonthSelector color={C.linkedin} />

                    <SectionHeader icon={TrendingUp} title="Evolução do LinkedIn" subtitle="Impressões, alcance e engajamento" color={C.linkedin} />
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
                        <ResponsiveContainer width="100%" height={280}>
                            <ComposedChart data={liData}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis yAxisId="imp" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis yAxisId="eng" orientation="right" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar yAxisId="imp" dataKey="impressoes" fill={C.linkedin + "45"} name="Impressões" radius={[4, 4, 0, 0]} /><Line yAxisId="imp" type="monotone" dataKey="alcance" stroke={C.linkedinLight} strokeWidth={3} dot={{ r: 4, fill: C.linkedinLight }} name="Alcance" /><Line yAxisId="eng" type="monotone" dataKey="engajamento" stroke={C.accent} strokeWidth={2.5} dot={{ r: 3, fill: C.accent }} name="Engajamento" /></ComposedChart>
                        </ResponsiveContainer>
                        <div style={{ marginTop: 10, padding: "10px 14px", background: C.linkedin + "10", borderRadius: 10, border: `1px solid ${C.linkedin}20` }}>
                            <p style={{ margin: 0, fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
                                <strong style={{ color: C.linkedinLight }}>⚠️ Alerta:</strong> Tendência de queda desde outubro. Engajamento caiu de 2.034 → 197 (-90%). O canal precisa de estratégia editorial exclusiva com foco em voz institucional e dados macro.
                            </p>
                        </div>
                    </div>

                    {/* 🆕 CIDADES LINKEDIN */}
                    <SectionHeader icon={MapPin} title="Seguidores por Região" subtitle={`Distribuição geográfica — ${MONTHS_FULL[mi]}`} color={C.linkedinLight} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
                            <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Ranking por Região</h4>
                            <CityChart data={LI.regioes.map(r => ({ cidade: r.cidade, seg: r.seg }))} color={C.linkedin} monthIdx={mi} />
                        </div>
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
                            <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Evolução por Região (10 meses)</h4>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={MONTHS.map((m, i) => { const d = { mes: m }; LI.regioes.forEach(r => { d[r.cidade] = r.seg[i]; }); return d; })}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 9 }} />
                                    {LI.regioes.map((r, i) => <Line key={i} type="monotone" dataKey={r.cidade} stroke={[C.linkedin, C.accent, C.green, C.purple, C.cyan][i]} strokeWidth={2} dot={{ r: 2 }} />)}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Indústrias e Funções */}
                    <SectionHeader icon={Users} title="Perfil da Audiência" subtitle="Seguidores por indústria e função (último mês disponível)" color={C.accent} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
                            <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 12px", fontWeight: 600 }}>Por Indústria</h4>
                            {LI.industrias.map((ind, i) => {
                                const pct = (ind.seg / LI.industrias[0].seg) * 100;
                                return (
                                    <div key={i} style={{ marginBottom: 10 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                            <span style={{ fontSize: 12, color: C.text }}>{ind.nome}</span>
                                            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{ind.seg}</span>
                                        </div>
                                        <div style={{ height: 5, background: C.border, borderRadius: 3 }}>
                                            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${C.linkedin}, ${C.linkedinLight})`, borderRadius: 3 }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
                            <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 12px", fontWeight: 600 }}>Por Função</h4>
                            {LI.funcoes.map((f, i) => {
                                const pct = (f.seg / LI.funcoes[0].seg) * 100;
                                return (
                                    <div key={i} style={{ marginBottom: 10 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                            <span style={{ fontSize: 12, color: C.text }}>{f.nome}</span>
                                            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{f.seg}</span>
                                        </div>
                                        <div style={{ height: 5, background: C.border, borderRadius: 3 }}>
                                            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`, borderRadius: 3 }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <SectionHeader icon={Users} title="Seguidores & Novos por Mês" subtitle="Aquisição mensal" color={C.green} />
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
                        <ResponsiveContainer width="100%" height={220}>
                            <ComposedChart data={liData}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis yAxisId="n" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis yAxisId="t" orientation="right" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[4600, 5100]} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar yAxisId="n" dataKey="novos" fill={C.linkedin} name="Novos" radius={[4, 4, 0, 0]} /><Line yAxisId="t" type="monotone" dataKey="seguidores" stroke={C.green} strokeWidth={2.5} dot={{ r: 3, fill: C.green }} name="Total" /></ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </>)}

                {/* ========== SITE GA4 ========== */}
                {tab === "site" && (<>
                    {/* 🆕 ALL GA4 METRICS */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 20 }}>
                        <MetricCard title="Usuários Totais" value={fmt(GA4.usuariosTotais[mi])} variation={calcVar(GA4.usuariosTotais, mi)} icon={Users} color={C.ga4} small />
                        <MetricCard title="Usuários Ativos" value={fmt(GA4.usuariosAtivos[mi])} variation={calcVar(GA4.usuariosAtivos, mi)} icon={Activity} color={C.green} small />
                        <MetricCard title="Novos Usuários" value={fmt(GA4.novosUsuarios[mi])} variation={calcVar(GA4.novosUsuarios, mi)} icon={TrendingUp} color={C.cyan} small />
                        <MetricCard title="Sessões" value={fmt(GA4.sessoes[mi])} variation={calcVar(GA4.sessoes, mi)} icon={Globe} color={C.purple} small />
                        <MetricCard title="Sess. Engajadas" value={fmt(GA4.sessoesEngajadas[mi])} variation={calcVar(GA4.sessoesEngajadas, mi)} icon={Target} color={C.accent} small />
                        <MetricCard title="Taxa Engajam." value={GA4.taxaEngajamento[mi] + "%"} variation={mi > 0 ? (GA4.taxaEngajamento[mi] - GA4.taxaEngajamento[mi - 1]).toFixed(1) : null} icon={Zap} color={C.primaryLight} subtitle="pp" small />
                        <MetricCard title="Tempo Médio/User" value={GA4.tempoMedioEngajamento[mi] + "s"} variation={calcVar(GA4.tempoMedioEngajamento, mi)} icon={Clock} color={C.orange} small />
                        <MetricCard title="Views/Sessão" value={GA4.viewsPorSessao[mi].toString()} variation={calcVar(GA4.viewsPorSessao, mi)} icon={Eye} color={C.instagram} small />
                        <MetricCard title="Nº Eventos" value={fmt(GA4.numEventos[mi])} variation={calcVar(GA4.numEventos, mi)} icon={Monitor} color={C.red} small />
                    </div>
                    <MonthSelector color={C.ga4} />

                    <SectionHeader icon={Globe} title="Tráfego Mensal Completo" subtitle="Usuários, sessões e sessões engajadas" color={C.ga4} />
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
                        <ResponsiveContainer width="100%" height={280}>
                            <ComposedChart data={ga4Data}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
                                <Area type="monotone" dataKey="sessoes" stroke={C.ga4} strokeWidth={2} fill={C.ga4 + "12"} name="Sessões" />
                                <Area type="monotone" dataKey="usuarios" stroke={C.green} strokeWidth={2} fill={C.green + "08"} name="Usuários Ativos" />
                                <Line type="monotone" dataKey="engajadas" stroke={C.accent} strokeWidth={2.5} dot={{ r: 3, fill: C.accent }} name="Sessões Engajadas" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
                        <div>
                            <SectionHeader icon={Target} title="Taxa de Engajamento" subtitle="Evolução mensal (%)" color={C.green} />
                            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={ga4Data}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} domain={[40, 70]} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="taxaEng" stroke={C.green} strokeWidth={2.5} fill={C.green + "15"} name="Taxa %" /></AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div>
                            <SectionHeader icon={Clock} title="Tempo Médio (seg)" subtitle="Tempo médio de engajamento por usuário" color={C.accent} />
                            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={ga4Data}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="tempoMedio" fill={C.accent} name="Tempo (s)" radius={[4, 4, 0, 0]}>{ga4Data.map((d, i) => <Cell key={i} fill={d.tempoMedio >= 50 ? C.green : d.tempoMedio >= 40 ? C.accent : C.red + "90"} />)}</Bar></BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* 🆕 PÁGINAS MAIS ACESSADAS */}
                    <SectionHeader icon={FileText} title="Páginas Mais Acessadas" subtitle={`Top 5 — ${MONTHS_FULL[mi]}`} color={C.purple} />
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px" }}>
                        <DataTable headers={["Página", "Visualizações", "Tempo Médio"]} rows={paginasRows} />
                        <div style={{ marginTop: 16 }}>
                            <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Evolução das Top 3 Páginas</h4>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={MONTHS.map((m, idx) => ({ mes: m, Home: GA4.paginas[0].views[idx], Empréstimo: GA4.paginas[1].views[idx], Simulador: GA4.paginas[2].views[idx] }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
                                    <Line type="monotone" dataKey="Home" stroke={C.ga4} strokeWidth={2.5} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="Empréstimo" stroke={C.accent} strokeWidth={2.5} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="Simulador" stroke={C.green} strokeWidth={2.5} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 🆕 ORIGEM DO TRÁFEGO */}
                    <SectionHeader icon={Link2} title="Origem do Tráfego" subtitle={`Fontes de sessões — ${MONTHS_FULL[mi]}`} color={C.cyan} />
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px" }}>
                        <DataTable headers={["Fonte", "Sessões", "Taxa Engaj.", "Tempo Médio"]} rows={origensRows} />
                        <div style={{ marginTop: 16 }}>
                            <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Evolução: Google Orgânico vs Direto</h4>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={MONTHS.map((m, idx) => ({ mes: m, Google: GA4.origens[0].sessoes[idx], Direto: GA4.origens[1].sessoes[idx] }))}>
                                    <defs>
                                        <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.ga4} stopOpacity={0.2} /><stop offset="100%" stopColor={C.ga4} stopOpacity={0} /></linearGradient>
                                        <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.orange} stopOpacity={0.15} /><stop offset="100%" stopColor={C.orange} stopOpacity={0} /></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
                                    <Area type="monotone" dataKey="Google" stroke={C.ga4} strokeWidth={2.5} fill="url(#gG)" name="Google Orgânico" />
                                    <Area type="monotone" dataKey="Direto" stroke={C.orange} strokeWidth={2} fill="url(#gD)" name="Direto" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ marginTop: 12, padding: "10px 14px", background: C.ga4 + "10", borderRadius: 10, border: `1px solid ${C.ga4}20` }}>
                            <p style={{ margin: 0, fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
                                <strong style={{ color: C.ga4Light }}>📌 Insight:</strong> O Google Orgânico mantém taxa de engajamento superior (~75%) com tempo médio de 1min+, enquanto o Direto tem menor engajamento (~36%) e tempo menor (~22s). Forte indicativo de que o SEO atrai visitas mais qualificadas. Oportunidade: ampliar conteúdo otimizado para SEO nas páginas de Simulador e Investimentos.
                            </p>
                        </div>
                    </div>
                </>)}

                {/* ========== TEMAS ========== */}
                {tab === "temas" && (<>
                    <SectionHeader icon={Layers} title="Temas com Maior Relevância — Instagram" subtitle="Ranking por curtidas acumuladas nos 10 meses" color={C.instagram} />
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px" }}>
                        <ThemeRankCard themes={TOP_THEMES_IG} platform="ig" />
                        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                            {TOP_THEMES_IG.slice(0, 3).map((t, i) => (
                                <div key={i} style={{ background: C.bg, borderRadius: 10, padding: "14px", border: `1px solid ${C.border}` }}>
                                    <div style={{ fontSize: 18, marginBottom: 4 }}>{t.icon}</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>{t.tema}</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                                        <div><span style={{ fontSize: 9, color: C.textDim }}>Curtidas</span><div style={{ fontSize: 14, fontWeight: 700, color: C.instagram }}>{t.curtidas}</div></div>
                                        <div><span style={{ fontSize: 9, color: C.textDim }}>Comentários</span><div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{t.comentarios}</div></div>
                                        <div><span style={{ fontSize: 9, color: C.textDim }}>Compartilh.</span><div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{t.compartilhamentos}</div></div>
                                        <div><span style={{ fontSize: 9, color: C.textDim }}>Alcance médio</span><div style={{ fontSize: 14, fontWeight: 700, color: C.purple }}>{t.alcanceMedio}</div></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <SectionHeader icon={Layers} title="Temas com Maior Relevância — LinkedIn" subtitle="Ranking por engajamento acumulado" color={C.linkedin} />
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px" }}>
                        <ThemeRankCard themes={TOP_THEMES_LI} platform="li" />
                        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                            {TOP_THEMES_LI.slice(0, 3).map((t, i) => (
                                <div key={i} style={{ background: C.bg, borderRadius: 10, padding: "14px", border: `1px solid ${C.border}` }}>
                                    <div style={{ fontSize: 18, marginBottom: 4 }}>{t.icon}</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>{t.tema}</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                                        <div><span style={{ fontSize: 9, color: C.textDim }}>Engajamento</span><div style={{ fontSize: 14, fontWeight: 700, color: C.linkedin }}>{fmt(t.engajamento)}</div></div>
                                        <div><span style={{ fontSize: 9, color: C.textDim }}>Cliques</span><div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{t.cliques}</div></div>
                                        <div><span style={{ fontSize: 9, color: C.textDim }}>Alcance médio</span><div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{t.alcanceMedio}</div></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <SectionHeader icon={Award} title="Canal Principal por Indicador" color={C.primary} />
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
                            {[
                                { metric: "Crescimento Seguidores", winner: "LinkedIn", value: "+340 (7.2%)", color: C.linkedin, note: "Base maior, crescimento constante" },
                                { metric: "Engajamento / Post", winner: "Instagram", value: "Reels ~10% ER", color: C.instagram, note: "Reels são motor de engajamento" },
                                { metric: "Alcance Orgânico", winner: "Instagram", value: "2.4k (Jan)", color: C.instagram, note: "Dobrou com estratégia de Reels" },
                                { metric: "Cliques / Ações", winner: "LinkedIn", value: "1.4k pico (Out)", color: C.linkedin, note: "Eventos geram mais ação" },
                                { metric: "Tráfego pro Site", winner: "Google Orgânico", value: "~55% do tráfego", color: C.ga4, note: "SEO é o maior canal de aquisição" },
                                { metric: "Autoridade", winner: "LinkedIn", value: "Governança + Dados", color: C.linkedin, note: "Posts de congressos e conselhos" },
                            ].map((item, i) => (
                                <div key={i} style={{ padding: "14px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                                    <div style={{ fontSize: 10, color: C.textDim, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.metric}</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: item.color, marginBottom: 3 }}>{item.winner}</div>
                                    <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{item.value}</div>
                                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{item.note}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <SectionHeader icon={Zap} title="Insights Estratégicos" subtitle="Baseados na análise dos 10 meses" color={C.accent} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[
                            { title: "🎬 Reels é o motor", desc: "Jan/26: +233% em Reels = +298% interações + +104% alcance. Conteúdo comportamental e provocativo supera técnico isolado.", color: C.instagram },
                            { title: "⚠️ LinkedIn: reposicionar", desc: "Engajamento caiu 90% em 3 meses. Editorial exclusivo urgente: voz institucional, macrocenário e dados com profundidade.", color: C.linkedin },
                            { title: "📊 'Dados que Falam' é universal", desc: "Funciona em ambos canais. No IG gera curtidas, no LI gera cliques. Manter como pilar fixo quinzenal.", color: C.primary },
                            { title: "🌐 Site: revisar UX", desc: "Taxa de engajamento caiu de 63% para 48%. Páginas-chave precisam de CTAs mais claros e fluxo otimizado.", color: C.ga4 },
                            { title: "📱 Stories = oportunidade", desc: "Jul teve 33 stories e 5.4k views. Quando há ritmo, a audiência acompanha. Canal de educação e interação.", color: C.accent },
                            { title: "🎯 Meta 2026: +50% engaj.", desc: "Dobrar Reels (min 8/mês), editorial exclusivo LI, 'Dados que Falam' quinzenal, integração redes→site.", color: C.green },
                        ].map((ins, i) => (
                            <div key={i} style={{ background: C.card, border: `1px solid ${ins.color}25`, borderRadius: 12, padding: "18px", borderLeft: `3px solid ${ins.color}` }}>
                                <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: C.text }}>{ins.title}</h4>
                                <p style={{ margin: 0, fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>{ins.desc}</p>
                            </div>
                        ))}
                    </div>
                </>)}

                <div style={{ marginTop: 44, paddingTop: 16, borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: C.textDim }}>Dashboard gerado por ALPE Digital • Dados extraídos de Reportei • Período: Abr/2025 – Jan/2026</p>
                </div>
            </div>
        </div>
    );
}
