import React, { useState } from "react";
import { Users, Eye, Heart, MousePointerClick, Video, Activity, TrendingUp, MapPin } from "lucide-react";
import { ComposedChart, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useInstagram } from "../../hooks/useMetrics";
import { useClientContext } from "../../contexts/ClientContext";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import MetricCard from "../../components/ui/MetricCard";
import SectionHeader from "../../components/ui/SectionHeader";
import CustomTooltip from "../../components/ui/CustomTooltip";
import { C } from "../../utils/colors";
import { fmt, calcVar } from "../../utils/format";

function MonthSelector({ months, selected, onSelect, color }) {
  return (
    <div style={{ display: "flex", gap: 5, marginBottom: 22, overflowX: "auto", paddingBottom: 4 }}>
      {months.map((m, i) => (
        <button key={i} onClick={() => onSelect(i)} style={{ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap", background: selected === i ? color + "25" : C.card, color: selected === i ? color : C.textMuted, outline: selected === i ? `1px solid ${color}50` : `1px solid ${C.border}` }}>
          {m.monthLabel}
        </button>
      ))}
    </div>
  );
}

export default function InstagramTab() {
  const clientId = useClientContext();
  const { data, loading, error } = useInstagram(clientId);
  const [mi, setMi] = useState(9);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { metrics, cities, themes } = data;
  if (!metrics?.length) return <ErrorState message="Nenhum dado disponível. Clique em Sincronizar para buscar os dados." />;

  const safeMi = Math.min(mi, metrics.length - 1);
  const m = metrics[safeMi];

  const segs     = metrics.map(x => x.seguidores);
  const alcances = metrics.map(x => x.alcanceOrganico);
  const vizs     = metrics.map(x => x.visualizacoes);
  const interacs = metrics.map(x => x.interacoes);
  const visitas  = metrics.map(x => x.visitasPerfil);
  const reelsInt = metrics.map(x => x.reelsInteracoes);

  const igData = metrics.map(x => ({
    mes: x.monthLabel?.split("/")[0],
    seguidores: x.seguidores, alcance: x.alcanceOrganico,
    visualizacoes: x.visualizacoes, interacoes: x.interacoes,
    visitasPerfil: x.visitasPerfil,
    reelsAlcance: x.reelsAlcance, reelsInteracoes: x.reelsInteracoes,
    storiesViews: x.storiesViews,
    postagens: x.postagensTotal, reelsQtd: x.reelsQtd, storiesQtd: x.storiesQtd,
    novos: x.novosSeguidores,
  }));

  const cityData = cities
    .map(c => ({ cidade: c.name.split(",")[0], seguidores: c.metrics.find(cm => cm.month === metrics[safeMi]?.month)?.seguidores ?? 0 }))
    .sort((a, b) => b.seguidores - a.seguidores);

  // City evolution data for line chart
  const cityEvolution = metrics.map((met, idx) => {
    const d = { mes: met.monthLabel?.split("/")[0] };
    cities.forEach(c => {
      d[c.name.split(",")[0]] = c.metrics.find(cm => cm.month === met.month)?.seguidores ?? null;
    });
    return d;
  });

  const CITY_COLORS = [C.instagram, C.accent, C.green, C.purple, C.cyan, C.orange];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 20 }}>
        <MetricCard title="Seguidores"     value={m.seguidores.toLocaleString()}    variation={calcVar(segs, safeMi)}     icon={Users}            color={C.instagram}    small />
        <MetricCard title="Alcance Org."   value={fmt(m.alcanceOrganico)}           variation={calcVar(alcances, safeMi)} icon={Eye}              color={C.green}        small />
        <MetricCard title="Visualizações"  value={fmt(m.visualizacoes)}             variation={calcVar(vizs, safeMi)}     icon={Activity}         color={C.purple}       small />
        <MetricCard title="Interações"     value={m.interacoes.toString()}          variation={calcVar(interacs, safeMi)} icon={Heart}            color={C.accent}       small />
        <MetricCard title="Visitas Perfil" value={m.visitasPerfil.toString()}       variation={calcVar(visitas, safeMi)}  icon={MousePointerClick} color={C.primaryLight} small />
        <MetricCard title="Reels Inter."   value={m.reelsInteracoes.toString()}     variation={calcVar(reelsInt, safeMi)} icon={Video}            color={C.red}          small />
      </div>

      <MonthSelector months={metrics} selected={safeMi} onSelect={setMi} color={C.instagram} />

      {/* Alcance & Visualizações */}
      <SectionHeader icon={Eye} title="Alcance & Visualizações" subtitle="Evolução orgânica mensal" color={C.instagram} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={igData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="l" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="r" orientation="right" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar  yAxisId="r" dataKey="visualizacoes" fill={C.instagram + "35"} name="Visualizações" radius={[4,4,0,0]} />
            <Line yAxisId="l" type="monotone" dataKey="alcance" stroke={C.instagramLight} strokeWidth={3} dot={{ r: 4, fill: C.instagramLight }} name="Alcance Orgânico" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Reels & Volume */}
      <SectionHeader icon={Video} title="Reels & Volume de Conteúdo" subtitle="Quantidade, alcance e interações" color={C.red} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
          <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Reels: Alcance vs Interações</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={igData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="reelsAlcance"    fill={C.instagram} name="Alcance"    radius={[3,3,0,0]} />
              <Bar dataKey="reelsInteracoes" fill={C.accent}    name="Interações" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
          <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Volume Mensal (Feed + Reels + Stories)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={igData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="postagens"  stackId="a" fill={C.primaryLight} name="Feed"    />
              <Bar dataKey="reelsQtd"  stackId="a" fill={C.instagram}    name="Reels"   />
              <Bar dataKey="storiesQtd" stackId="a" fill={C.accent}      name="Stories" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cidades */}
      {cities.length > 0 && (
        <>
          <SectionHeader icon={MapPin} title="Cidades com Maior Nº de Seguidores" subtitle={`Distribuição geográfica — ${metrics[safeMi]?.monthLabel}`} color={C.instagramLight} />
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
              <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Evolução por Cidade</h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={cityEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 9 }} />
                  {cities.map((c, i) => (
                    <Line key={i} type="monotone" dataKey={c.name.split(",")[0]} stroke={CITY_COLORS[i % CITY_COLORS.length]} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Crescimento de Seguidores */}
      <SectionHeader icon={TrendingUp} title="Crescimento de Seguidores" subtitle="Novos seguidores mês a mês" color={C.green} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={igData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="n" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="t" orientation="right" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="n" dataKey="novos" fill={C.green} name="Novos" radius={[4,4,0,0]}>
              {igData.map((_, i) => <Cell key={i} fill={i === safeMi ? C.green : C.green + "55"} />)}
            </Bar>
            <Line yAxisId="t" type="monotone" dataKey="seguidores" stroke={C.instagram} strokeWidth={2.5} dot={{ r: 3, fill: C.instagram }} name="Total" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
