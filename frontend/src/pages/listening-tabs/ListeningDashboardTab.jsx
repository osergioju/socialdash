import React from "react";
import { MessageSquare, Smile, Frown, Meh, Gauge, TrendingUp, Newspaper, Hash, Layers, Cloud } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from "recharts";
import MetricCard from "../../components/ui/MetricCard";
import SectionHeader from "../../components/ui/SectionHeader";
import CustomTooltip from "../../components/ui/CustomTooltip";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

const SENTIMENT_COLORS = { Positivas: C.green, Negativas: C.red, Neutras: C.textDim };

const SOURCE_LABEL = {
  GOOGLE_NEWS: "Google News",
  REDDIT: "Reddit",
  YOUTUBE: "YouTube",
  RSS: "RSS / Blogs",
};

const PERIOD_OPTIONS = [
  { value: 7,  label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
];

function scoreLabel(score) {
  if (score >= 0.3)  return { label: "Positivo", color: C.green };
  if (score <= -0.3) return { label: "Negativo", color: C.red };
  return { label: "Neutro", color: C.accent };
}

export default function ListeningDashboardTab({ data, days, onDaysChange }) {
  const { kpis, mentionsPerDay, bySource, byCategory, topThemes, topWords, topHashtags, latestMentions } = data;
  const sc = scoreLabel(kpis.avgScore);

  const pieData = [
    { name: "Positivas", value: kpis.positive },
    { name: "Negativas", value: kpis.negative },
    { name: "Neutras",   value: kpis.neutral },
  ].filter((d) => d.value > 0);

  const maxWordCount = topWords[0]?.count || 1;

  return (
    <>
      {/* Filtro de período */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {PERIOD_OPTIONS.map((p) => (
          <button key={p.value} onClick={() => onDaysChange(p.value)} style={{
            padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit",
            border: `1px solid ${days === p.value ? C.primary : C.border}`,
            background: days === p.value ? C.primary + "22" : "transparent",
            color: days === p.value ? C.primaryLight : C.textMuted,
          }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        <MetricCard title="Menções"          value={fmt(kpis.totalMentions)} icon={MessageSquare} color={C.cyan} />
        <MetricCard title="Sentimento Médio" value={`${kpis.avgScore > 0 ? "+" : ""}${kpis.avgScore}`} icon={Gauge} color={sc.color} subtitle={sc.label} />
        <MetricCard title="Positivas"        value={fmt(kpis.positive)}      icon={Smile} color={C.green} />
        <MetricCard title="Negativas"        value={fmt(kpis.negative)}      icon={Frown} color={C.red} />
        <MetricCard title="Neutras"          value={fmt(kpis.neutral)}       icon={Meh}   color={C.textDim} />
      </div>

      {/* Menções por dia */}
      <SectionHeader icon={TrendingUp} title="Menções por Dia" subtitle="Evolução do volume por sentimento" color={C.cyan} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 28 }}>
        {mentionsPerDay.length === 0 ? (
          <p style={{ color: C.textDim, fontSize: 12, textAlign: "center", padding: "40px 0" }}>Sem menções no período. Use "Coletar agora" para buscar.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={mentionsPerDay}>
              <defs>
                <linearGradient id="gTot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.cyan} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="total"    stroke={C.cyan}  strokeWidth={2.5} fill="url(#gTot)"     name="Total" />
              <Area type="monotone" dataKey="positive" stroke={C.green} strokeWidth={1.5} fill={C.green + "10"} name="Positivas" />
              <Area type="monotone" dataKey="negative" stroke={C.red}   strokeWidth={1.5} fill={C.red + "10"}   name="Negativas" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Sentimento + Fontes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10 }}>Distribuição de Sentimentos</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={78} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={SENTIMENT_COLORS[entry.name]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: C.textDim, fontSize: 12, textAlign: "center", padding: "60px 0" }}>Sem análises ainda</p>
          )}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Newspaper size={13} color={C.accent} /> Menções por Fonte
          </div>
          {bySource.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={bySource.map((s) => ({ ...s, fonte: SOURCE_LABEL[s.source] || s.source }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="fonte" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill={C.accent} name="Menções" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: C.textDim, fontSize: 12, textAlign: "center", padding: "60px 0" }}>Sem dados</p>
          )}
        </div>
      </div>

      {/* Categorias + Temas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Layers size={13} color={C.purple} /> Distribuição por Categoria
          </div>
          {byCategory.length === 0 && <p style={{ color: C.textDim, fontSize: 12 }}>Sem categorias ainda</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {byCategory.slice(0, 8).map((cat) => {
              const max = byCategory[0]?.count || 1;
              return (
                <div key={cat.category}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11.5, color: C.text }}>{cat.category}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.purple }}>{cat.count}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: C.cardHover, overflow: "hidden" }}>
                    <div style={{ width: `${(cat.count / max) * 100}%`, height: "100%", background: C.purple, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Hash size={13} color={C.cyan} /> Top Assuntos & Hashtags
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {topThemes.map((t) => (
              <span key={t.theme} style={{ fontSize: 11, fontWeight: 600, padding: "4px 11px", borderRadius: 20, background: C.cyan + "18", color: C.cyan }}>
                {t.theme} · {t.count}
              </span>
            ))}
            {topThemes.length === 0 && <span style={{ color: C.textDim, fontSize: 12 }}>Sem temas ainda</span>}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {topHashtags.map((h) => (
              <span key={h.tag} style={{ fontSize: 11, padding: "4px 11px", borderRadius: 20, background: C.cardHover, color: C.textMuted, border: `1px solid ${C.border}` }}>
                {h.tag} · {h.count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Nuvem de palavras */}
      <SectionHeader icon={Cloud} title="Nuvem de Palavras" subtitle="Termos mais frequentes nas menções" color={C.primary} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 22px", marginBottom: 28, display: "flex", flexWrap: "wrap", gap: "10px 16px", alignItems: "center", justifyContent: "center" }}>
        {topWords.length === 0 && <p style={{ color: C.textDim, fontSize: 12, margin: 0 }}>Sem palavras ainda</p>}
        {topWords.map((w, i) => {
          const scale = w.count / maxWordCount;
          const palette = [C.primaryLight, C.cyan, C.accent, C.purple, C.green];
          return (
            <span key={w.word} title={`${w.count} ocorrências`} style={{
              fontSize: 11 + scale * 17,
              fontWeight: 400 + Math.round(scale * 4) * 100,
              color: palette[i % palette.length],
              opacity: 0.55 + scale * 0.45,
              lineHeight: 1.2,
            }}>
              {w.word}
            </span>
          );
        })}
      </div>

      {/* Últimas menções */}
      <SectionHeader icon={MessageSquare} title="Últimas Menções" subtitle="As 10 mais recentes do período" color={C.cyan} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {latestMentions.map((m) => {
          const color = m.sentiment === "POSITIVE" ? C.green : m.sentiment === "NEGATIVE" ? C.red : C.textDim;
          return (
            <a key={m.id} href={m.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title || m.url}</div>
                <div style={{ fontSize: 10.5, color: C.textDim, marginTop: 2 }}>
                  {SOURCE_LABEL[m.sourceType] || m.sourceType}{m.sourceName ? ` · ${m.sourceName}` : ""}
                  {m.publishedAt ? ` · ${new Date(m.publishedAt).toLocaleDateString("pt-BR")}` : ""}
                </div>
              </div>
            </a>
          );
        })}
        {latestMentions.length === 0 && <p style={{ color: C.textDim, fontSize: 12 }}>Nenhuma menção no período.</p>}
      </div>
    </>
  );
}
