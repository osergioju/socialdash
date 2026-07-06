import React from "react";
import { Eye, MousePointerClick, Heart, TrendingUp, PieChart as PieIcon, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import MetricCard from "../../components/ui/MetricCard";
import SectionHeader from "../../components/ui/SectionHeader";
import CustomTooltip from "../../components/ui/CustomTooltip";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

const CHANNEL_META = {
  INSTAGRAM: { label: "Instagram", color: C.instagram },
  LINKEDIN:  { label: "LinkedIn",  color: C.linkedin },
  WEBSITE:   { label: "Website",   color: C.ga4 },
};

export default function CampaignOverviewTab({ data, onGoToContent }) {
  const { consolidado, timeline, instagram, linkedin, website } = data;
  const hasContent = (instagram?.postsCount || 0) + (linkedin?.postsCount || 0) + (website?.pagesCount || 0) > 0;

  if (!hasContent) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <BarChart3 size={48} color={C.textDim} style={{ marginBottom: 14 }} />
        <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>Nenhum conteúdo associado à campanha ainda.</p>
        <button onClick={onGoToContent} style={{ marginTop: 14, padding: "9px 18px", borderRadius: 9, border: "none", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
          Associar Conteúdos
        </button>
      </div>
    );
  }

  const pieData = consolidado.byChannel
    .filter((c) => c.engagement > 0)
    .map((c) => ({ name: CHANNEL_META[c.channel]?.label || c.channel, value: c.engagement, color: CHANNEL_META[c.channel]?.color || C.purple }));

  const barData = consolidado.byChannel.map((c) => ({
    canal: CHANNEL_META[c.channel]?.label || c.channel,
    Alcance: c.reach,
    Impressões: c.impressions,
    Engajamento: c.engagement,
    Cliques: c.clicks,
  }));

  return (
    <>
      {/* KPIs consolidados */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 28 }}>
        <MetricCard title="Alcance Total"     value={fmt(consolidado.totalReach)}       icon={Eye}               color={C.primary} />
        <MetricCard title="Impressões Totais" value={fmt(consolidado.totalImpressions)} icon={TrendingUp}        color={C.purple} />
        <MetricCard title="Engajamento Total" value={fmt(consolidado.totalEngagement)}  icon={Heart}             color={C.instagram} />
        <MetricCard title="Cliques Totais"    value={fmt(consolidado.totalClicks)}      icon={MousePointerClick} color={C.accent} />
      </div>

      {/* Comparação por canal */}
      <SectionHeader icon={BarChart3} title="Comparação por Canal" subtitle="Alcance, impressões, engajamento e cliques" color={C.primary} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 28 }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="canal" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Alcance"     fill={C.primary}   radius={[4, 4, 0, 0]} />
            <Bar dataKey="Impressões"  fill={C.purple}    radius={[4, 4, 0, 0]} />
            <Bar dataKey="Engajamento" fill={C.instagram} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Cliques"     fill={C.accent}    radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Participação percentual */}
      <SectionHeader icon={PieIcon} title="Participação por Canal" subtitle="Share de engajamento entre canais" color={C.accent} />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) 1.4fr", gap: 16, marginBottom: 28 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: C.textDim, fontSize: 12, textAlign: "center", padding: "80px 0" }}>Sem engajamento registrado</p>
          )}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
          {consolidado.byChannel.map((c) => {
            const meta = CHANNEL_META[c.channel] || { label: c.channel, color: C.purple };
            return (
              <div key={c.channel}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{meta.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{c.engagementShare}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 6, background: C.cardHover, overflow: "hidden" }}>
                  <div style={{ width: `${c.engagementShare}%`, height: "100%", borderRadius: 6, background: meta.color }} />
                </div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>
                  Alcance {fmt(c.reach)} · Impressões {fmt(c.impressions)} · Engajamento {fmt(c.engagement)} · Cliques {fmt(c.clicks)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evolução temporal */}
      {timeline?.length > 0 && (
        <>
          <SectionHeader icon={TrendingUp} title="Evolução Temporal" subtitle="Engajamento diário por canal (website = sessões)" color={C.green} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={timeline}>
                <defs>
                  {Object.entries(CHANNEL_META).map(([key, meta]) => (
                    <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={meta.color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={meta.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="instagram" stroke={C.instagram} strokeWidth={2} fill={`url(#grad-INSTAGRAM)`} name="Instagram" connectNulls />
                <Area type="monotone" dataKey="linkedin"  stroke={C.linkedin}  strokeWidth={2} fill={`url(#grad-LINKEDIN)`}  name="LinkedIn"  connectNulls />
                <Area type="monotone" dataKey="website"   stroke={C.ga4}       strokeWidth={2} fill={`url(#grad-WEBSITE)`}   name="Website"   connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </>
  );
}
