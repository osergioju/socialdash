import React, { useState } from "react";
import { Users, Eye, Heart, MousePointerClick, BarChart3, TrendingUp, MapPin, Zap } from "lucide-react";
import { ComposedChart, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useLinkedin } from "../../hooks/useMetrics";
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

function InlineBarList({ items, valueKey, color }) {
  const max = Math.max(...items.map(i => i[valueKey] || 0), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => {
        const val = item[valueKey] || 0;
        const pct = (val / max) * 100;
        return (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: C.text }}>{item.nome}</span>
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>{val.toLocaleString()}</span>
            </div>
            <div style={{ height: 5, background: C.border, borderRadius: 3 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)`, borderRadius: 3 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LinkedinTab() {
  const clientId = useClientContext();
  const { data, loading, error } = useLinkedin(clientId);
  const [mi, setMi] = useState(9);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { metrics, cities, industries, roles } = data;
  if (!metrics?.length) return <ErrorState message="Nenhum dado disponível. Clique em Sincronizar para buscar os dados." />;

  const safeMi = Math.min(mi, metrics.length - 1);
  const m = metrics[safeMi];

  const segs  = metrics.map(x => x.seguidores);
  const alcs  = metrics.map(x => x.alcance);
  const engs  = metrics.map(x => x.engajamento);
  const clis  = metrics.map(x => x.cliques);
  const reacs = metrics.map(x => x.reacoes);
  const imps  = metrics.map(x => x.impressoes);

  const liData = metrics.map(x => ({
    mes: x.monthLabel?.split("/")[0],
    seguidores: x.seguidores, alcance: x.alcance,
    impressoes: x.impressoes, engajamento: x.engajamento,
    cliques: x.cliques, reacoes: x.reacoes,
    postagens: x.postagens, novos: x.novosSeguidores,
  }));

  const cityData = cities
    .map(c => ({ cidade: c.name.split(",")[0], seguidores: c.metrics.find(cm => cm.month === metrics[safeMi]?.month)?.seguidores ?? 0 }))
    .sort((a, b) => b.seguidores - a.seguidores);

  const cityEvolution = metrics.map(met => {
    const d = { mes: met.monthLabel?.split("/")[0] };
    cities.forEach(c => { d[c.name.split(",")[0]] = c.metrics.find(cm => cm.month === met.month)?.seguidores ?? null; });
    return d;
  });

  const REGION_COLORS = [C.linkedin, C.accent, C.green, C.purple, C.cyan];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 20 }}>
        <MetricCard title="Seguidores"  value={m.seguidores.toLocaleString()} variation={calcVar(segs, safeMi)}  icon={Users}            color={C.linkedin}      small />
        <MetricCard title="Alcance"     value={fmt(m.alcance)}               variation={calcVar(alcs, safeMi)}  icon={Eye}              color={C.green}         small />
        <MetricCard title="Impressões"  value={fmt(m.impressoes)}            variation={calcVar(imps, safeMi)}  icon={BarChart3}        color={C.primary}       small />
        <MetricCard title="Engajamento" value={fmt(m.engajamento)}           variation={calcVar(engs, safeMi)}  icon={Heart}            color={C.accent}        small />
        <MetricCard title="Cliques"     value={fmt(m.cliques)}               variation={calcVar(clis, safeMi)}  icon={MousePointerClick} color={C.primaryLight} small />
        <MetricCard title="Reações"     value={m.reacoes.toString()}         variation={calcVar(reacs, safeMi)} icon={Zap}              color={C.orange}        small />
      </div>

      <MonthSelector months={metrics} selected={safeMi} onSelect={setMi} color={C.linkedin} />

      {/* Evolução completa: impressões + alcance + engajamento */}
      <SectionHeader icon={TrendingUp} title="Evolução do LinkedIn" subtitle="Impressões, alcance e engajamento" color={C.linkedin} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={liData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="imp" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="eng" orientation="right" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar  yAxisId="imp" dataKey="impressoes"  fill={C.linkedin + "45"} name="Impressões" radius={[4,4,0,0]} />
            <Line yAxisId="imp" type="monotone" dataKey="alcance"     stroke={C.linkedinLight} strokeWidth={3} dot={{ r: 4, fill: C.linkedinLight }} name="Alcance" />
            <Line yAxisId="eng" type="monotone" dataKey="engajamento" stroke={C.accent}        strokeWidth={2.5} dot={{ r: 3, fill: C.accent }}        name="Engajamento" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Regiões */}
      {cities.length > 0 && (
        <>
          <SectionHeader icon={MapPin} title="Seguidores por Região" subtitle={`Distribuição geográfica — ${metrics[safeMi]?.monthLabel}`} color={C.linkedinLight} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
              <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Ranking por Região</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cityData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="cidade" tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="seguidores" name="Seguidores" radius={[0,6,6,0]}>
                    {cityData.map((_, i) => <Cell key={i} fill={i === 0 ? C.linkedin : C.linkedin + "80"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
              <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Evolução por Região</h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={cityEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 9 }} />
                  {cities.map((c, i) => (
                    <Line key={i} type="monotone" dataKey={c.name.split(",")[0]} stroke={REGION_COLORS[i % REGION_COLORS.length]} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Perfil da Audiência */}
      {(industries.length > 0 || roles.length > 0) && (
        <>
          <SectionHeader icon={Users} title="Perfil da Audiência" subtitle="Seguidores por indústria e função" color={C.accent} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
              <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 12px", fontWeight: 600 }}>Por Indústria</h4>
              <InlineBarList items={industries} valueKey="seguidores" color={C.linkedin} />
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
              <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 12px", fontWeight: 600 }}>Por Função</h4>
              <InlineBarList items={roles} valueKey="seguidores" color={C.accent} />
            </div>
          </div>
        </>
      )}

      {/* Seguidores & Novos */}
      <SectionHeader icon={Users} title="Seguidores & Novos por Mês" subtitle="Aquisição mensal" color={C.green} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={liData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="n" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="t" orientation="right" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar  yAxisId="n" dataKey="novos" fill={C.linkedin} name="Novos" radius={[4,4,0,0]} />
            <Line yAxisId="t" type="monotone" dataKey="seguidores" stroke={C.green} strokeWidth={2.5} dot={{ r: 3, fill: C.green }} name="Total" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
