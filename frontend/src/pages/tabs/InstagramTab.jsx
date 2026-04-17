import React, { useState } from "react";
import { Users, Eye, Heart, MousePointerClick, Video, Activity, TrendingUp, MapPin } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, LineChart, Line, ComposedChart,
} from "recharts";
import { useInstagram } from "../../hooks/useMetrics";
import { useClientContext } from "../../contexts/ClientContext";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import SectionHeader from "../../components/ui/SectionHeader";
import CustomTooltip from "../../components/ui/CustomTooltip";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

// % change from prev to curr; returns string or null
function calcVar(curr, prev) {
  if (prev == null || curr == null || prev === 0) return null;
  return (((curr - prev) / Math.abs(prev)) * 100).toFixed(1);
}

function MetricCard({ title, value, variation, icon: Icon, color, small }) {
  const isPos = parseFloat(variation) > 0;
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.card} 0%, ${C.cardHover || C.card} 100%)`,
      border: `1px solid ${C.border}`, borderRadius: 14,
      padding: small ? "14px 16px" : "18px 20px",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: color, opacity: 0.06 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{ background: color + "20", borderRadius: 7, padding: 5, display: "flex" }}>
          <Icon size={small ? 13 : 15} color={color} />
        </div>
        <span style={{ color: C.textMuted, fontSize: small ? 10 : 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
      </div>
      <div style={{ fontSize: small ? 20 : 26, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>{value}</div>
      {variation != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 5 }}>
          {isPos ? <ArrowUpRight size={12} color={C.green} /> : <ArrowDownRight size={12} color={C.red} />}
          <span style={{ fontSize: 11, fontWeight: 600, color: isPos ? C.green : C.red }}>
            {isPos ? "+" : ""}{variation}%
          </span>
          <span style={{ fontSize: 10, color: C.textMuted }}>vs anterior</span>
        </div>
      )}
    </div>
  );
}

const CITY_COLORS = [C.instagram, C.accent, C.green, C.purple, C.cyan || "#06B6D4", C.orange || "#F97316"];

export default function InstagramTab() {
  const clientId = useClientContext();
  const { data, loading, error } = useInstagram(clientId);
  const [mi, setMi] = useState(0); // 0 = mês mais recente

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { metrics, cities } = data;
  if (!metrics?.length) return <ErrorState message="Nenhum dado disponível. Clique em Sincronizar para buscar os dados." />;

  // Ordena do mais antigo → mais recente (para gráficos)
  const sorted = [...metrics].sort((a, b) => a.month.localeCompare(b.month));

  // Seletor: mais recente primeiro
  const reversedForSelector = [...sorted].reverse();
  const safeMi = Math.min(mi, reversedForSelector.length - 1);
  const m    = reversedForSelector[safeMi];
  const prev = reversedForSelector[safeMi + 1] ?? null;

  // Dados para gráficos (ordem cronológica)
  const chartData = sorted.map(x => ({
    mes:             x.monthLabel,
    seguidores:      x.seguidores,
    alcance:         x.alcanceOrganico,
    visualizacoes:   x.visualizacoes,
    interacoes:      x.interacoes,
    reelsAlcance:    x.reelsAlcance,
    reelsInteracoes: x.reelsInteracoes,
    postagens:       x.postagensTotal,   // total (feed + reels) — label "Feed" igual à referência
    reelsQtd:        x.reelsQtd,
    storiesQtd:      x.storiesQtd,
    novos:           x.novosSeguidores,
    visitasPerfil:   x.visitasPerfil,
  }));

  // Índice do mês selecionado no array cronológico (para highlight nas células)
  const selectedIdxInSorted = sorted.indexOf(m);

  // Cidades — ranking do mês mais recente
  const cityData = cities
    .map(c => ({
      cidade:     c.name.split(",")[0],
      seguidores: c.metrics[c.metrics.length - 1]?.seguidores ?? 0,
      allMetrics: c.metrics,
      name:       c.name,
    }))
    .filter(c => c.seguidores > 0)
    .sort((a, b) => b.seguidores - a.seguidores);

  // Evolução por cidade — uma linha por cidade ao longo dos meses
  const cityEvolutionData = sorted.map(x => {
    const entry = { mes: x.monthLabel };
    cityData.forEach(c => {
      const cm = c.allMetrics.find(cm => cm.month === x.month);
      entry[c.cidade] = cm?.seguidores ?? null;
    });
    return entry;
  });

  return (
    <>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 20 }}>
        <MetricCard title="Seguidores"     value={m.seguidores.toLocaleString("pt-BR")}  variation={calcVar(m.seguidores,      prev?.seguidores)}      icon={Users}             color={C.instagram}    small />
        <MetricCard title="Alcance Org."   value={fmt(m.alcanceOrganico)}                variation={calcVar(m.alcanceOrganico, prev?.alcanceOrganico)}  icon={Eye}               color={C.green}        small />
        <MetricCard title="Visualizações"  value={fmt(m.visualizacoes)}                  variation={calcVar(m.visualizacoes,   prev?.visualizacoes)}    icon={Activity}          color={C.purple}       small />
        <MetricCard title="Interações"     value={fmt(m.interacoes)}                     variation={calcVar(m.interacoes,      prev?.interacoes)}       icon={Heart}             color={C.accent}       small />
        <MetricCard title="Visitas Perfil" value={fmt(m.visitasPerfil)}                  variation={calcVar(m.visitasPerfil,   prev?.visitasPerfil)}    icon={MousePointerClick} color={C.primaryLight} small />
        <MetricCard title="Reels Inter."   value={fmt(m.reelsInteracoes)}                variation={calcVar(m.reelsInteracoes, prev?.reelsInteracoes)}  icon={Video}             color={C.red}          small />
      </div>

      {/* Seletor de mês */}
      <div style={{ display: "flex", gap: 5, marginBottom: 22, flexWrap: "wrap" }}>
        {reversedForSelector.map((x, i) => (
          <button
            key={x.month}
            onClick={() => setMi(i)}
            style={{
              padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap",
              background: safeMi === i ? C.instagram + "25" : C.card,
              color:      safeMi === i ? C.instagram : C.textMuted,
              outline:    safeMi === i ? `1px solid ${C.instagram}50` : `1px solid ${C.border}`,
            }}
          >
            {x.monthLabel}
          </button>
        ))}
      </div>

      {/* Alcance & Visualizações — ComposedChart (Bar visualizações + Line alcance) */}
      <SectionHeader icon={Eye} title="Alcance & Visualizações" subtitle="Evolução orgânica mensal" color={C.instagram} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="l" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="r" orientation="right" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar    yAxisId="r" dataKey="visualizacoes" fill={C.instagram + "35"} name="Visualizações"    radius={[4, 4, 0, 0]} />
            <Line   yAxisId="l" type="monotone" dataKey="alcance" stroke={C.instagramLight} strokeWidth={3}
                    dot={{ r: 4, fill: C.instagramLight }} name="Alcance Orgânico" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Reels & Volume */}
      <SectionHeader icon={Video} title="Reels & Volume de Conteúdo" subtitle="Quantidade, alcance e interações" color={C.red} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
          <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Reels: Alcance vs Interações</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="reelsAlcance"    name="Alcance"    fill={C.instagram} radius={[3, 3, 0, 0]} />
              <Bar dataKey="reelsInteracoes" name="Interações" fill={C.accent}    radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
          <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Volume Mensal (Feed + Reels + Stories)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
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
          <SectionHeader icon={MapPin} title="Cidades com Maior Nº de Seguidores" subtitle={`Distribuição geográfica — ${m.monthLabel}`} color={C.instagramLight} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {/* Ranking por cidade */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
              <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Ranking por Cidade</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cityData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="cidade" tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="seguidores" name="Seguidores" radius={[0, 6, 6, 0]}>
                    {cityData.map((_, i) => <Cell key={i} fill={i === 0 ? C.instagram : C.instagram + "80"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Evolução por cidade */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
              <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Evolução por Cidade</h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={cityEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  {cityData.slice(0, 6).map((c, i) => (
                    <Line
                      key={c.cidade}
                      type="monotone"
                      dataKey={c.cidade}
                      stroke={CITY_COLORS[i]}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Crescimento de Seguidores — ComposedChart (Bar novos + Line total) */}
      <SectionHeader icon={TrendingUp} title="Crescimento de Seguidores" subtitle="Novos seguidores mês a mês" color={C.green} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="n" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="t" orientation="right" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="n" dataKey="novos" fill={C.green} name="Novos" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={i === selectedIdxInSorted ? C.green : C.green + "55"} />
              ))}
            </Bar>
            <Line
              yAxisId="t" type="monotone" dataKey="seguidores"
              stroke={C.instagram} strokeWidth={2.5}
              dot={{ r: 3, fill: C.instagram }} name="Total"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
