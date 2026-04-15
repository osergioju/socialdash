import React, { useState } from "react";
import { Globe, Users, Activity, Clock, MousePointerClick, Link2 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useGa4 } from "../../hooks/useMetrics";
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

export default function Ga4Tab() {
  const { data, loading, error } = useGa4();
  const [mi, setMi] = useState(9);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { metrics, pages, origins } = data;
  if (!metrics?.length) return <ErrorState message="Nenhum dado disponível" />;
  const safeMi = Math.min(mi, metrics.length - 1);
  const m = metrics[safeMi];
  const uAtivos = metrics.map(x => x.usuariosAtivos);
  const novos   = metrics.map(x => x.novosUsuarios);
  const sessoes = metrics.map(x => x.sessoes);
  const txEng   = metrics.map(x => x.taxaEngajamento);
  const eventos = metrics.map(x => x.numEventos);

  const ga4Data = metrics.map(x => ({
    mes: x.monthLabel?.split("/")[0],
    usuarios: x.usuariosAtivos, novos: x.novosUsuarios,
    sessoes: x.sessoes, engajadas: x.sessoesEngajadas,
    taxaEng: x.taxaEngajamento, tempoMedio: x.tempoMedioEngajamento,
    eventos: x.numEventos, viewsPorSessao: x.viewsPorSessao,
    totais: x.usuariosTotais,
  }));

  // Pages table
  const monthKey = metrics[safeMi]?.month;
  const paginasRows = pages.map(p => {
    const pm = p.metrics.find(pm => pm.month === monthKey);
    return [p.label, pm?.views != null ? fmt(pm.views) : "—", pm?.tempoMedio != null ? pm.tempoMedio + "s" : "—"];
  });

  // Origins table
  const origensRows = origins.map(o => {
    const om = o.metrics.find(om => om.month === monthKey);
    if (!om) return null;
    return [o.fonte, om.sessoes != null ? fmt(om.sessoes) : "—", om.taxaEng != null ? om.taxaEng + "%" : "—", om.tempoMedio != null ? om.tempoMedio + "s" : "—"];
  }).filter(Boolean).filter(r => r[1] !== "—");

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 20 }}>
        <MetricCard title="Usuários Ativos"  value={fmt(m.usuariosAtivos)}        variation={calcVar(uAtivos, safeMi)} icon={Users}            color={C.ga4}     small />
        <MetricCard title="Novos Usuários"   value={fmt(m.novosUsuarios)}         variation={calcVar(novos, safeMi)}   icon={Users}            color={C.green}   small />
        <MetricCard title="Sessões"          value={fmt(m.sessoes)}               variation={calcVar(sessoes, safeMi)} icon={Activity}         color={C.primary} small />
        <MetricCard title="Taxa Engaj."      value={m.taxaEngajamento + "%"}      variation={calcVar(txEng, safeMi)}   icon={MousePointerClick} color={C.accent} small />
        <MetricCard title="Tempo Médio"      value={m.tempoMedioEngajamento + "s"} variation={null}                icon={Clock}            color={C.orange}  small />
        <MetricCard title="Num. Eventos"     value={fmt(m.numEventos)}            variation={calcVar(eventos, safeMi)} icon={Activity}         color={C.purple}  small />
      </div>

      <MonthSelector months={metrics} selected={safeMi} onSelect={setMi} color={C.ga4} />

      <SectionHeader icon={Users} title="Usuários & Sessões" subtitle="Evolução mensal" color={C.ga4} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={ga4Data}>
            <defs>
              <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.ga4}  stopOpacity={0.25} />
                <stop offset="100%" stopColor={C.ga4}  stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gSess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.green} stopOpacity={0.2} />
                <stop offset="100%" stopColor={C.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="usuarios" stroke={C.ga4}   strokeWidth={2.5} fill="url(#gU)"    name="Usuários Ativos" />
            <Area type="monotone" dataKey="sessoes"  stroke={C.green} strokeWidth={2}   fill="url(#gSess)" name="Sessões" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <SectionHeader icon={Activity} title="Taxa de Engajamento" subtitle="% sessões com engajamento real" color={C.accent} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={ga4Data}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[40, 80]} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="taxaEng" stroke={C.accent} strokeWidth={2.5} dot={{ r: 4, fill: C.accent }} name="Taxa Eng." unit="%" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Páginas Mais Acessadas — {metrics[safeMi]?.monthLabel}</h4>
          <DataTable headers={["Página", "Views", "Tempo Médio"]} rows={paginasRows} />
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Origens de Tráfego — {metrics[safeMi]?.monthLabel}</h4>
          <DataTable headers={["Fonte", "Sessões", "Taxa Eng.", "Tempo"]} rows={origensRows} />
        </div>
      </div>
    </>
  );
}
