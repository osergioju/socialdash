import React from "react";
import { Globe, Users, Eye, Clock, Zap, Target, TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import MetricCard from "../../components/ui/MetricCard";
import SectionHeader from "../../components/ui/SectionHeader";
import CustomTooltip from "../../components/ui/CustomTooltip";
import DataTable from "../../components/ui/DataTable";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

export default function CampaignWebsiteTab({ data }) {
  const website = data.website;

  if (!website) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <Globe size={48} color={C.textDim} style={{ marginBottom: 14 }} />
        <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>
          Sem dados do site. Verifique se há páginas vinculadas à campanha e se o GA4 está conectado.
        </p>
      </div>
    );
  }

  const t = website.totals;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        <MetricCard title="Sessões"        value={fmt(t.sessions)}            icon={TrendingUp} color={C.ga4} small />
        <MetricCard title="Usuários"       value={fmt(t.users)}               icon={Users}      color={C.primary} small />
        <MetricCard title="Novos Usuários" value={fmt(t.newUsers)}            icon={Users}      color={C.green} small />
        <MetricCard title="Visualizações"  value={fmt(t.views)}               icon={Eye}        color={C.purple} small />
        <MetricCard title="Tempo Médio"    value={`${t.avgEngagementTime}s`}  icon={Clock}      color={C.accent} small />
        <MetricCard title="Eventos"        value={fmt(t.events)}              icon={Zap}        color={C.cyan} small />
        <MetricCard title="Conversões"     value={fmt(t.conversions)}         icon={Target}     color={C.instagram} small />
        <MetricCard title="Tx. Engajamento" value={`${t.engagementRate}%`}    icon={TrendingUp} color={C.orange} small />
      </div>

      {website.timeseries?.length > 0 && (
        <>
          <SectionHeader icon={TrendingUp} title="Evolução no Período" subtitle="Sessões, usuários e visualizações por dia" color={C.ga4} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 28 }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={website.timeseries}>
                <defs>
                  <linearGradient id="gCampSess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ga4} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={C.ga4} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="sessions" stroke={C.ga4}    strokeWidth={2.5} fill="url(#gCampSess)"   name="Sessões" />
                <Area type="monotone" dataKey="users"    stroke={C.green}  strokeWidth={2}   fill={C.green + "10"}    name="Usuários" />
                <Area type="monotone" dataKey="views"    stroke={C.purple} strokeWidth={2}   fill={C.purple + "10"}   name="Visualizações" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {website.pages?.length > 0 && (
        <>
          <SectionHeader icon={Globe} title="Páginas da Campanha" subtitle="Desempenho por página no período" color={C.primary} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "10px 6px" }}>
            <DataTable
              headers={["Página", "Views", "Sessões", "Usuários"]}
              rows={website.pages.map((p) => [p.pagePath, fmt(p.views), fmt(p.sessions), fmt(p.users)])}
            />
          </div>
        </>
      )}
    </>
  );
}
