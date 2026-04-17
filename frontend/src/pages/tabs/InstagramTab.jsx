import React, { useState } from "react";
import { Users, Eye, Heart, MousePointerClick, Video, Activity, TrendingUp, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line } from "recharts";
import { useInstagram } from "../../hooks/useMetrics";
import { useClientContext } from "../../contexts/ClientContext";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import MetricCard from "../../components/ui/MetricCard";
import SectionHeader from "../../components/ui/SectionHeader";
import CustomTooltip from "../../components/ui/CustomTooltip";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

export default function InstagramTab() {
  const clientId = useClientContext();
  const { data, loading, error } = useInstagram(clientId);
  const [mi, setMi] = useState(0); // 0 = mês mais recente

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { metrics, cities } = data;
  if (!metrics?.length) return <ErrorState message="Nenhum dado disponível. Clique em Sincronizar para buscar os dados." />;

  // Ordena do mais antigo para o mais recente (para os gráficos)
  const sorted = [...metrics].sort((a, b) => a.month.localeCompare(b.month));

  // Mês selecionado (índice do mais recente = 0)
  const reversedForSelector = [...sorted].reverse();
  const safeMi = Math.min(mi, reversedForSelector.length - 1);
  const m = reversedForSelector[safeMi];

  // Dados para gráficos (sempre ordem cronológica: mais antigo → mais recente)
  const chartData = sorted.map(x => ({
    mes:             x.monthLabel,
    alcance:         x.alcanceOrganico,
    visualizacoes:   x.visualizacoes,
    interacoes:      x.interacoes,
    reelsAlcance:    x.reelsAlcance,
    reelsInteracoes: x.reelsInteracoes,
    feed:            x.postagensTotal - x.reelsQtd,
    reels:           x.reelsQtd,
    stories:         x.storiesQtd,
    novos:           x.novosSeguidores,
    visitasPerfil:   x.visitasPerfil,
  }));

  // Cidades
  const cityData = cities
    .map(c => ({
      cidade:     c.name.split(",")[0],
      seguidores: c.metrics[c.metrics.length - 1]?.seguidores ?? 0,
    }))
    .filter(c => c.seguidores > 0)
    .sort((a, b) => b.seguidores - a.seguidores);

  return (
    <>
      {/* Seletor de mês */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {reversedForSelector.map((x, i) => (
          <button
            key={x.month}
            onClick={() => setMi(i)}
            style={{
              padding: "5px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 600, fontFamily: "inherit",
              background: safeMi === i ? C.instagram + "25" : C.card,
              color:      safeMi === i ? C.instagram : C.textMuted,
              outline:    safeMi === i ? `1px solid ${C.instagram}50` : `1px solid ${C.border}`,
            }}
          >
            {x.monthLabel}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 20 }}>
        <MetricCard title="Seguidores"     value={m.seguidores.toLocaleString("pt-BR")} icon={Users}             color={C.instagram}    small />
        <MetricCard title="Alcance Org."   value={fmt(m.alcanceOrganico)}               icon={Eye}               color={C.green}        small />
        <MetricCard title="Visualizações"  value={fmt(m.visualizacoes)}                 icon={Activity}          color={C.purple}       small />
        <MetricCard title="Interações"     value={fmt(m.interacoes)}                    icon={Heart}             color={C.accent}       small />
        <MetricCard title="Visitas Perfil" value={fmt(m.visitasPerfil)}                 icon={MousePointerClick} color={C.primaryLight} small />
        <MetricCard title="Reels Inter."   value={fmt(m.reelsInteracoes)}               icon={Video}             color={C.red}          small />
      </div>

      {/* Alcance & Visualizações */}
      <SectionHeader icon={Eye} title="Alcance & Visualizações" subtitle="Por mês" color={C.instagram} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="alcance"       name="Alcance Orgânico" fill={C.instagramLight}    radius={[4,4,0,0]}>
              {chartData.map((_, i) => <Cell key={i} fill={i === sorted.indexOf(m) ? C.instagramLight : C.instagramLight + "80"} />)}
            </Bar>
            <Bar dataKey="visualizacoes" name="Visualizações"    fill={C.instagram + "60"} radius={[4,4,0,0]}>
              {chartData.map((_, i) => <Cell key={i} fill={i === sorted.indexOf(m) ? C.instagram + "60" : C.instagram + "30"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reels & Volume */}
      <SectionHeader icon={Video} title="Reels & Volume de Conteúdo" subtitle="Por mês" color={C.red} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
          <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Reels: Alcance vs Interações</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={2}>
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
          <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Volume por Mês (Feed + Reels + Stories)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="feed"    stackId="a" fill={C.primaryLight} name="Feed"    />
              <Bar dataKey="reels"   stackId="a" fill={C.instagram}    name="Reels"   />
              <Bar dataKey="stories" stackId="a" fill={C.accent}       name="Stories" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Novos Seguidores — linha */}
      <SectionHeader icon={TrendingUp} title="Novos Seguidores por Mês" subtitle="Ganho mensal (dados disponíveis nos últimos 30 dias de cada sync)" color={C.green} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32, marginBottom: 16, paddingLeft: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: C.textMuted }}>Seguidores Hoje</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.instagram }}>{m.seguidores.toLocaleString("pt-BR")}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.textMuted }}>Novos em {m.monthLabel}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.green }}>+{fmt(m.novosSeguidores)}</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="novos" name="Novos Seguidores" stroke={C.green} strokeWidth={2} dot={{ fill: C.green, r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cidades */}
      {cityData.length > 0 && (
        <>
          <SectionHeader icon={MapPin} title="Cidades com Maior Nº de Seguidores" subtitle="Distribuição geográfica" color={C.instagramLight} />
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
              <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Interações por Mês</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="interacoes" name="Interações" radius={[4,4,0,0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={i === sorted.indexOf(m) ? C.instagram : C.instagram + "55"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </>
  );
}
