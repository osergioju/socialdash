import React from "react";
import { Users, Eye, Globe, Heart } from "lucide-react";
import { ComposedChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useOverview } from "../../hooks/useMetrics";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import MetricCard from "../../components/ui/MetricCard";
import SectionHeader from "../../components/ui/SectionHeader";
import CustomTooltip from "../../components/ui/CustomTooltip";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

export default function OverviewTab() {
  const { data, loading, error } = useOverview();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const { kpis, timeseries } = data;

  // Merge IG + LI + GA4 timeseries by monthKey
  const merged = timeseries.instagram.map((ig, i) => ({
    mes: ig.mes,
    igSeg: ig.igSeg, igAlc: ig.igAlc,
    liSeg: timeseries.linkedin[i]?.liSeg,
    liAlc: timeseries.linkedin[i]?.liAlc,
    usuarios: timeseries.ga4[i]?.usuarios,
    sessoes: timeseries.ga4[i]?.sessoes,
  }));

  const igTotal = (kpis.igSeguidores.value ?? 0);
  const igFirst = igTotal - Math.round(igTotal * kpis.igSeguidores.growth / (100 + kpis.igSeguidores.growth));

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        <MetricCard title="Seg. Instagram" value={kpis.igSeguidores.value?.toLocaleString()} variation={kpis.igSeguidores.growth} icon={Users} color={C.instagram} subtitle="10 meses" />
        <MetricCard title="Seg. LinkedIn"  value={kpis.liSeguidores.value?.toLocaleString()} variation={kpis.liSeguidores.growth} icon={Users} color={C.linkedin} subtitle="10 meses" />
        <MetricCard title="Views IG Total" value={fmt(kpis.totalViewsIG.value)} variation={kpis.totalViewsIG.variation} icon={Eye} color={C.purple} />
        <MetricCard title="Usuários Site"  value={fmt(kpis.usuariosSite.value)} variation={kpis.usuariosSite.variation} icon={Globe} color={C.ga4} />
        <MetricCard title="Alcance IG"     value={fmt(kpis.alcanceIG.value)} variation={kpis.alcanceIG.variation} icon={Eye} color={C.green} />
        <MetricCard title="Engaj. LI"      value={fmt(kpis.engajamentoLI.value)} variation={kpis.engajamentoLI.variation} icon={Heart} color={C.orange} />
      </div>

      <SectionHeader icon={Users} title="Evolução de Seguidores" subtitle="Crescimento comparativo Instagram vs LinkedIn" color={C.primary} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 28 }}>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={merged}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="ig" orientation="left"  tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[1800, 2300]} />
            <YAxis yAxisId="li" orientation="right" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[4600, 5100]} />
            <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Line yAxisId="ig" type="monotone" dataKey="igSeg" stroke={C.instagram} strokeWidth={3} dot={{ r: 4, fill: C.instagram }} name="Instagram" />
            <Line yAxisId="li" type="monotone" dataKey="liSeg" stroke={C.linkedin}  strokeWidth={3} dot={{ r: 4, fill: C.linkedin }}  name="LinkedIn" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <SectionHeader icon={Eye} title="Alcance por Canal" subtitle="Volumetria mensal — Instagram vs LinkedIn" color={C.accent} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 28 }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={merged} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="igAlc" fill={C.instagram} name="Instagram" radius={[4, 4, 0, 0]} />
            <Bar dataKey="liAlc" fill={C.linkedin}  name="LinkedIn"  radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionHeader icon={Globe} title="Tráfego do Site" subtitle="Usuários ativos e sessões mensais" color={C.ga4} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={merged}>
            <defs>
              <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.ga4} stopOpacity={0.2} />
                <stop offset="100%" stopColor={C.ga4} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="usuarios" stroke={C.ga4}   strokeWidth={2.5} fill="url(#gS)"       name="Usuários Ativos" />
            <Area type="monotone" dataKey="sessoes"  stroke={C.green}  strokeWidth={2}   fill={C.green + "10"} name="Sessões" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
