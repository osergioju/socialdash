import React, { useState } from "react";
import { Users, Eye, Globe, Activity, Target, Zap, Clock, Monitor, TrendingUp, FileText, Link2 } from "lucide-react";
import { ComposedChart, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useGa4 } from "../../hooks/useMetrics";
import { useClientContext } from "../../contexts/ClientContext";
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
  const clientId = useClientContext();
  const { data, loading, error } = useGa4(clientId);
  const [mi, setMi] = useState(9);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { metrics, pages, origins } = data;
  if (!metrics?.length) return <ErrorState message="Nenhum dado disponível. Clique em Sincronizar para buscar os dados." />;

  const safeMi = Math.min(mi, metrics.length - 1);
  const m = metrics[safeMi];
  const monthKey = metrics[safeMi]?.month;

  const uAtivos = metrics.map(x => x.usuariosAtivos);
  const novos   = metrics.map(x => x.novosUsuarios);
  const totais  = metrics.map(x => x.usuariosTotais);
  const sessoes = metrics.map(x => x.sessoes);
  const sesEng  = metrics.map(x => x.sessoesEngajadas);
  const txEng   = metrics.map(x => x.taxaEngajamento);
  const tempo   = metrics.map(x => x.tempoMedioEngajamento);
  const views   = metrics.map(x => x.viewsPorSessao);
  const eventos = metrics.map(x => x.numEventos);

  const ga4Data = metrics.map(x => ({
    mes: x.monthLabel?.split("/")[0],
    usuarios: x.usuariosAtivos, novos: x.novosUsuarios, totais: x.usuariosTotais,
    sessoes: x.sessoes, engajadas: x.sessoesEngajadas,
    taxaEng: x.taxaEngajamento, tempoMedio: x.tempoMedioEngajamento,
    eventos: x.numEventos, viewsPorSessao: x.viewsPorSessao,
  }));

  // Pages table
  const paginasRows = pages.map(p => {
    const met = p.metrics.find(pm => pm.month === monthKey);
    return [p.label, met?.views != null ? fmt(met.views) : "—", met?.tempoMedio != null ? met.tempoMedio + "s" : "—"];
  }).filter(r => r[1] !== "—");

  // Origins table
  const origensRows = origins.map(o => {
    const met = o.metrics.find(om => om.month === monthKey);
    if (!met || met.sessoes == null) return null;
    return [o.fonte, fmt(met.sessoes), met.taxaEng != null ? met.taxaEng + "%" : "—", met.tempoMedio != null ? met.tempoMedio + "s" : "—"];
  }).filter(Boolean);

  // Top 3 pages evolution line data
  const top3Pages = pages.slice(0, 3);
  const pagesEvoData = metrics.map(met => {
    const d = { mes: met.monthLabel?.split("/")[0] };
    top3Pages.forEach(p => {
      d[p.label] = p.metrics.find(pm => pm.month === met.month)?.views ?? null;
    });
    return d;
  });

  // Google vs Direto area data
  const googleOrigin = origins.find(o => o.fonte?.toLowerCase().includes("google"));
  const directOrigin = origins.find(o => o.fonte?.toLowerCase().includes("direct") || o.fonte === "(direct)");
  const originsEvoData = metrics.map(met => {
    const d = { mes: met.monthLabel?.split("/")[0] };
    if (googleOrigin) d["Google"] = googleOrigin.metrics.find(om => om.month === met.month)?.sessoes ?? null;
    if (directOrigin) d["Direto"] = directOrigin.metrics.find(om => om.month === met.month)?.sessoes ?? null;
    return d;
  });

  return (
    <>
      {/* 9 KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 20 }}>
        <MetricCard title="Usuários Totais"  value={fmt(m.usuariosTotais)}         variation={calcVar(totais,  safeMi)} icon={Users}            color={C.ga4}          small />
        <MetricCard title="Usuários Ativos"  value={fmt(m.usuariosAtivos)}         variation={calcVar(uAtivos, safeMi)} icon={Activity}         color={C.green}        small />
        <MetricCard title="Novos Usuários"   value={fmt(m.novosUsuarios)}          variation={calcVar(novos,   safeMi)} icon={TrendingUp}       color={C.cyan}         small />
        <MetricCard title="Sessões"          value={fmt(m.sessoes)}                variation={calcVar(sessoes, safeMi)} icon={Globe}            color={C.purple}       small />
        <MetricCard title="Sess. Engajadas"  value={fmt(m.sessoesEngajadas)}       variation={calcVar(sesEng,  safeMi)} icon={Target}           color={C.accent}       small />
        <MetricCard title="Taxa Engajam."    value={m.taxaEngajamento + "%"}       variation={safeMi > 0 ? (m.taxaEngajamento - metrics[safeMi - 1].taxaEngajamento).toFixed(1) : null} icon={Zap} color={C.primaryLight} subtitle="pp" small />
        <MetricCard title="Tempo Médio/User" value={m.tempoMedioEngajamento + "s"} variation={calcVar(tempo,   safeMi)} icon={Clock}            color={C.orange}       small />
        <MetricCard title="Views/Sessão"     value={m.viewsPorSessao?.toString()}  variation={calcVar(views,   safeMi)} icon={Eye}              color={C.instagram}    small />
        <MetricCard title="Nº Eventos"       value={fmt(m.numEventos)}             variation={calcVar(eventos, safeMi)} icon={Monitor}          color={C.red}          small />
      </div>

      <MonthSelector months={metrics} selected={safeMi} onSelect={setMi} color={C.ga4} />

      {/* Tráfego Mensal Completo */}
      <SectionHeader icon={Globe} title="Tráfego Mensal Completo" subtitle="Usuários, sessões e sessões engajadas" color={C.ga4} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={ga4Data}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="sessoes"   stroke={C.ga4}   strokeWidth={2}   fill={C.ga4   + "12"} name="Sessões" />
            <Area type="monotone" dataKey="usuarios"  stroke={C.green}  strokeWidth={2}   fill={C.green + "08"} name="Usuários Ativos" />
            <Line type="monotone" dataKey="engajadas" stroke={C.accent} strokeWidth={2.5} dot={{ r: 3, fill: C.accent }} name="Sessões Engajadas" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Taxa de Engajamento + Tempo Médio */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <SectionHeader icon={Target} title="Taxa de Engajamento" subtitle="Evolução mensal (%)" color={C.green} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={ga4Data}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="taxaEng" stroke={C.green} strokeWidth={2.5} fill={C.green + "15"} name="Taxa %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <SectionHeader icon={Clock} title="Tempo Médio (seg)" subtitle="Tempo médio de engajamento por usuário" color={C.accent} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ga4Data}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="tempoMedio" name="Tempo (s)" radius={[4,4,0,0]}>
                  {ga4Data.map((d, i) => (
                    <Cell key={i} fill={d.tempoMedio >= 50 ? C.green : d.tempoMedio >= 40 ? C.accent : C.red + "90"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Páginas mais acessadas */}
      {paginasRows.length > 0 && (
        <>
          <SectionHeader icon={FileText} title="Páginas Mais Acessadas" subtitle={`Top páginas — ${metrics[safeMi]?.monthLabel}`} color={C.purple} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px", marginBottom: 12 }}>
            <DataTable headers={["Página", "Visualizações", "Tempo Médio"]} rows={paginasRows} />
            {top3Pages.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Evolução das Top Páginas</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={pagesEvoData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
                    {top3Pages.map((p, i) => (
                      <Line key={i} type="monotone" dataKey={p.label} stroke={[C.ga4, C.accent, C.green][i]} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

      {/* Origem do Tráfego */}
      {origensRows.length > 0 && (
        <>
          <SectionHeader icon={Link2} title="Origem do Tráfego" subtitle={`Fontes de sessões — ${metrics[safeMi]?.monthLabel}`} color={C.cyan} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px" }}>
            <DataTable headers={["Fonte", "Sessões", "Taxa Engaj.", "Tempo Médio"]} rows={origensRows} />
            {(googleOrigin || directOrigin) && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Evolução: Google Orgânico vs Direto</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={originsEvoData}>
                    <defs>
                      <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.ga4} stopOpacity={0.2} /><stop offset="100%" stopColor={C.ga4} stopOpacity={0} /></linearGradient>
                      <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.orange} stopOpacity={0.15} /><stop offset="100%" stopColor={C.orange} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
                    {googleOrigin && <Area type="monotone" dataKey="Google" stroke={C.ga4}    strokeWidth={2.5} fill="url(#gG)" name="Google Orgânico" connectNulls />}
                    {directOrigin && <Area type="monotone" dataKey="Direto" stroke={C.orange} strokeWidth={2}   fill="url(#gD)" name="Direto"          connectNulls />}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
