import React from "react";
import { Users, Eye, Globe, Heart } from "lucide-react";
import { ComposedChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useOverview } from "../../hooks/useMetrics";
import { useClientContext } from "../../contexts/ClientContext";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import MetricCard from "../../components/ui/MetricCard";
import SectionHeader from "../../components/ui/SectionHeader";
import CustomTooltip from "../../components/ui/CustomTooltip";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

export default function OverviewTab() {
  const clientId = useClientContext();
  const { data, loading, error } = useOverview(clientId);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { kpis, timeseries, growth } = data;

  // IG uses period buckets (15/30/60/90 dias); LI/GA4 use monthly records
  const igData  = timeseries.instagram; // [{mes, igSeg, igAlc}, ...]
  const liLen   = timeseries.linkedin.length;
  const ga4Len  = timeseries.ga4.length;
  const maxLen  = Math.max(liLen, ga4Len);
  const merged  = Array.from({ length: maxLen }, (_, i) => ({
    mes:      timeseries.linkedin[i]?.mes || timeseries.ga4[i]?.mes,
    liSeg:    timeseries.linkedin[i]?.liSeg,
    liAlc:    timeseries.linkedin[i]?.liAlc,
    usuarios: timeseries.ga4[i]?.usuarios,
    sessoes:  timeseries.ga4[i]?.sessoes,
  }));

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        <MetricCard title="Seg. Instagram" value={kpis.igSeguidores.value?.toLocaleString()} variation={kpis.igSeguidores.growth} icon={Users} color={C.instagram} subtitle="período" />
        <MetricCard title="Seg. LinkedIn"  value={kpis.liSeguidores.value?.toLocaleString()} variation={kpis.liSeguidores.growth} icon={Users} color={C.linkedin} subtitle="período" />
        <MetricCard title="Views IG Total" value={fmt(kpis.totalViewsIG.value)} variation={kpis.totalViewsIG.variation} icon={Eye} color={C.purple} />
        <MetricCard title="Usuários Site"  value={fmt(kpis.usuariosSite.value)} variation={kpis.usuariosSite.variation} icon={Globe} color={C.ga4} />
        <MetricCard title="Alcance IG"     value={fmt(kpis.alcanceIG.value)} variation={kpis.alcanceIG.variation} icon={Eye} color={C.green} />
        <MetricCard title="Engaj. LI"      value={fmt(kpis.engajamentoLI.value)} variation={kpis.engajamentoLI.variation} icon={Heart} color={C.orange} />
      </div>

      {/* Instagram: alcance por período (15/30/60/90 dias) */}
      {igData.length > 0 && (
        <>
          <SectionHeader icon={Users} title="Instagram — Alcance por Período" subtitle="Acumulado nos últimos 15 / 30 / 60 / 90 dias" color={C.instagram} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
            {growth?.igTotal != null && (
              <div style={{ marginBottom: 12, paddingLeft: 8 }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>Novos seguidores (30 dias): </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.instagram }}>+{growth.igTotal}</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={igData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="igAlc" fill={C.instagram} name="Alcance Orgânico IG" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* LinkedIn: evolução mensal de seguidores */}
      {merged.length > 0 && (
        <>
          <SectionHeader icon={Users} title="LinkedIn — Evolução de Seguidores" subtitle="Crescimento mensal" color={C.linkedin} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 28 }}>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={merged}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="liSeg" stroke={C.linkedin} strokeWidth={3} dot={{ r: 4, fill: C.linkedin }} name="Seguidores LI" />
              </ComposedChart>
            </ResponsiveContainer>
            {growth?.liTotal != null && (
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.linkedin }}>
                  +{growth.liTotal}
                  {growth.liPct != null && <span style={{ fontSize: 11, fontWeight: 400 }}> ({growth.liPct}%)</span>}
                </span>
                <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 6 }}>no período</span>
              </div>
            )}
          </div>
        </>
      )}

      <SectionHeader icon={Eye} title="Alcance por Canal" subtitle="Volumetria — LinkedIn mensal" color={C.accent} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 28 }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={merged} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="liAlc" fill={C.linkedin} name="Alcance LinkedIn" radius={[4, 4, 0, 0]} />
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
