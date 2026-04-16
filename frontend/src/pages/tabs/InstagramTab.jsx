import React, { useState } from "react";
import { Users, Eye, Heart, MousePointerClick, Video, Activity, TrendingUp, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useInstagram } from "../../hooks/useMetrics";
import { useClientContext } from "../../contexts/ClientContext";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import MetricCard from "../../components/ui/MetricCard";
import SectionHeader from "../../components/ui/SectionHeader";
import CustomTooltip from "../../components/ui/CustomTooltip";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

const PERIOD_KEYS = ["last_15d", "last_30d", "last_60d", "last_90d"];
const PERIOD_LABEL = {
  last_15d: "15 dias",
  last_30d: "30 dias",
  last_60d: "60 dias",
  last_90d: "90 dias",
};

function PeriodSelector({ metrics, selected, onSelect, color }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
      {metrics.map((m, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          style={{
            padding: "5px 16px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 11, fontWeight: 600, fontFamily: "inherit",
            background: selected === i ? color + "25" : C.card,
            color: selected === i ? color : C.textMuted,
            outline: selected === i ? `1px solid ${color}50` : `1px solid ${C.border}`,
          }}
        >
          {PERIOD_LABEL[m.month] || m.monthLabel}
        </button>
      ))}
    </div>
  );
}

export default function InstagramTab() {
  const clientId = useClientContext();
  const { data, loading, error } = useInstagram(clientId);
  const [mi, setMi] = useState(1); // default: 30 dias

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { metrics, cities } = data;
  if (!metrics?.length) return <ErrorState message="Nenhum dado disponível. Clique em Sincronizar para buscar os dados." />;

  const safeMi = Math.min(mi, metrics.length - 1);
  const m = metrics[safeMi];

  // Build chart data for all 4 periods
  const igData = metrics.map(x => ({
    mes:              PERIOD_LABEL[x.month] || x.monthLabel,
    alcance:          x.alcanceOrganico,
    visualizacoes:    x.visualizacoes,
    interacoes:       x.interacoes,
    reelsAlcance:     x.reelsAlcance,
    reelsInteracoes:  x.reelsInteracoes,
    postagens:        x.postagensTotal - x.reelsQtd,  // feed only
    reelsQtd:         x.reelsQtd,
    storiesQtd:       x.storiesQtd,
    novos:            x.novosSeguidores,
  }));

  // City ranking — use latest available snapshot
  const cityData = cities
    .map(c => ({
      cidade: c.name.split(",")[0],
      seguidores: c.metrics[c.metrics.length - 1]?.seguidores ?? 0,
    }))
    .filter(c => c.seguidores > 0)
    .sort((a, b) => b.seguidores - a.seguidores);

  return (
    <>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 20 }}>
        <MetricCard title="Seguidores"     value={m.seguidores.toLocaleString()}  icon={Users}             color={C.instagram}    small />
        <MetricCard title="Alcance Org."   value={fmt(m.alcanceOrganico)}         icon={Eye}               color={C.green}        small />
        <MetricCard title="Visualizações"  value={fmt(m.visualizacoes)}           icon={Activity}          color={C.purple}       small />
        <MetricCard title="Interações"     value={fmt(m.interacoes)}              icon={Heart}             color={C.accent}       small />
        <MetricCard title="Visitas Perfil" value={fmt(m.visitasPerfil)}           icon={MousePointerClick} color={C.primaryLight} small />
        <MetricCard title="Reels Inter."   value={fmt(m.reelsInteracoes)}         icon={Video}             color={C.red}          small />
      </div>

      <PeriodSelector metrics={metrics} selected={safeMi} onSelect={setMi} color={C.instagram} />

      {/* Alcance & Visualizações */}
      <SectionHeader icon={Eye} title="Alcance & Visualizações" subtitle="Acumulado por período — 15 / 30 / 60 / 90 dias" color={C.instagram} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={igData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="alcance"       name="Alcance Orgânico" fill={C.instagramLight}    radius={[4,4,0,0]} />
            <Bar dataKey="visualizacoes" name="Visualizações"    fill={C.instagram + "60"} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reels & Volume */}
      <SectionHeader icon={Video} title="Reels & Volume de Conteúdo" subtitle="Quantidade e desempenho por período" color={C.red} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
          <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Reels: Alcance vs Interações</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={igData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="reelsAlcance"    name="Alcance"    fill={C.instagram} radius={[3,3,0,0]} />
              <Bar dataKey="reelsInteracoes" name="Interações" fill={C.accent}    radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
          <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Volume por Período (Feed + Reels + Stories)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={igData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="postagens"  stackId="a" fill={C.primaryLight} name="Feed"    />
              <Bar dataKey="reelsQtd"   stackId="a" fill={C.instagram}    name="Reels"   />
              <Bar dataKey="storiesQtd" stackId="a" fill={C.accent}       name="Stories" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cidades */}
      {cityData.length > 0 && (
        <>
          <SectionHeader icon={MapPin} title="Cidades com Maior Nº de Seguidores" subtitle="Distribuição geográfica atual" color={C.instagramLight} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
              <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Ranking por Cidade</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cityData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="cidade" tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="seguidores" name="Seguidores" radius={[0,6,6,0]}>
                    {cityData.map((_, i) => <Cell key={i} fill={i === 0 ? C.instagram : C.instagram + "80"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
              <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Interações por Período</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={igData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="interacoes" name="Interações" radius={[4,4,0,0]}>
                    {igData.map((_, i) => <Cell key={i} fill={i === safeMi ? C.instagram : C.instagram + "55"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Crescimento de Seguidores */}
      <SectionHeader icon={TrendingUp} title="Novos Seguidores por Período" subtitle="Ganho acumulado de seguidores (dados diários disponíveis nos últimos 90 dias)" color={C.green} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32, marginBottom: 16, paddingLeft: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: C.textMuted }}>Seguidores Hoje</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.instagram }}>{m.seguidores.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.textMuted }}>Novos ({PERIOD_LABEL[m.month] || m.monthLabel})</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.green }}>+{fmt(m.novosSeguidores)}</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={igData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="novos" name="Novos Seguidores" radius={[4,4,0,0]}>
              {igData.map((_, i) => <Cell key={i} fill={i === safeMi ? C.green : C.green + "55"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
