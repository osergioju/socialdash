import React, { useState } from "react";
import { Users, Eye, Heart, Activity, MousePointerClick, Video, Image } from "lucide-react";
import { ComposedChart, Line, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useInstagram } from "../../hooks/useMetrics";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import MetricCard from "../../components/ui/MetricCard";
import SectionHeader from "../../components/ui/SectionHeader";
import CustomTooltip from "../../components/ui/CustomTooltip";
import DataTable from "../../components/ui/DataTable";
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
  const { data, loading, error } = useInstagram();
  const [mi, setMi] = useState(9);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { metrics, cities, themes } = data;
  const m = metrics[mi];
  const segs      = metrics.map(x => x.seguidores);
  const alcances  = metrics.map(x => x.alcanceOrganico);
  const vizs      = metrics.map(x => x.visualizacoes);
  const interacs  = metrics.map(x => x.interacoes);
  const visitas   = metrics.map(x => x.visitasPerfil);
  const reelsInt  = metrics.map(x => x.reelsInteracoes);

  const igData = metrics.map(x => ({
    mes: x.monthLabel?.split("/")[0],
    seguidores: x.seguidores, alcance: x.alcanceOrganico,
    visualizacoes: x.visualizacoes, interacoes: x.interacoes,
    reelsAlcance: x.reelsAlcance, reelsInteracoes: x.reelsInteracoes,
    storiesViews: x.storiesViews, visitasPerfil: x.visitasPerfil,
    reelsQtd: x.reelsQtd, storiesQtd: x.storiesQtd, novos: x.novosSeguidores,
  }));

  // City chart for selected month
  const cityData = cities
    .map(c => ({ cidade: c.name.split(",")[0], seguidores: c.metrics.find(cm => cm.month === metrics[mi]?.month)?.seguidores ?? 0 }))
    .sort((a, b) => b.seguidores - a.seguidores);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 20 }}>
        <MetricCard title="Seguidores"     value={m.seguidores.toLocaleString()}    variation={calcVar(segs, mi)}     icon={Users}            color={C.instagram} small />
        <MetricCard title="Alcance Org."   value={fmt(m.alcanceOrganico)}           variation={calcVar(alcances, mi)} icon={Eye}              color={C.green}     small />
        <MetricCard title="Visualizações"  value={fmt(m.visualizacoes)}             variation={calcVar(vizs, mi)}     icon={Activity}         color={C.purple}    small />
        <MetricCard title="Interações"     value={m.interacoes.toString()}          variation={calcVar(interacs, mi)} icon={Heart}            color={C.accent}    small />
        <MetricCard title="Visitas Perfil" value={m.visitasPerfil.toString()}       variation={calcVar(visitas, mi)}  icon={MousePointerClick} color={C.primaryLight} small />
        <MetricCard title="Reels Inter."   value={m.reelsInteracoes.toString()}     variation={calcVar(reelsInt, mi)} icon={Video}            color={C.red}       small />
      </div>

      <MonthSelector months={metrics} selected={mi} onSelect={setMi} color={C.instagram} />

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

      <SectionHeader icon={Video} title="Reels & Volume de Conteúdo" subtitle="Quantidade, alcance e interações" color={C.red} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Reels: Alcance vs Interações</h4>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={igData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="reelsAlcance" fill={C.red + "40"} name="Alcance" radius={[3,3,0,0]} />
              <Line type="monotone" dataKey="reelsInteracoes" stroke={C.red} strokeWidth={2} dot={false} name="Interações" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Postagens & Stories por Mês</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={igData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="reelsQtd"  fill={C.red}             name="Reels"   radius={[3,3,0,0]} />
              <Bar dataKey="storiesQtd" fill={C.instagram + "80"} name="Stories" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SectionHeader icon={Image} title="Stories: Volume e Alcance" subtitle="Visualizações de stories mensais" color={C.instagramLight} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={igData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="storiesViews" name="Views Stories" radius={[4,4,0,0]}>
              {igData.map((_, i) => <Cell key={i} fill={i === mi ? C.instagramLight : C.instagram + "60"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionHeader icon={Users} title="Engajamento Detalhado" subtitle={`Mês selecionado: ${metrics[mi]?.monthLabel}`} color={C.accent} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
        <DataTable
          headers={["Métrica", "Valor"]}
          rows={[
            ["Curtidas em Posts", m.curtidasPosts.toString()],
            ["Comentários em Posts", m.comentariosPosts.toString()],
            ["Salvamentos em Posts", m.salvamentosPosts.toString()],
            ["Compartilhamentos em Posts", m.compartilhamentosPosts.toString()],
            ["Novos Seguidores", m.novosSeguidores.toString()],
            ["Postagens Totais", m.postagensTotal.toString()],
          ]}
        />
      </div>

      <SectionHeader icon={Users} title="Top Cidades — Seguidores" subtitle={`Por número de seguidores em ${metrics[mi]?.monthLabel}`} color={C.instagram} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
        <ResponsiveContainer width="100%" height={240}>
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
    </>
  );
}
