import React, { useState } from "react";
import { Users, Eye, Globe, Activity, Target, Zap, Clock, Monitor, TrendingUp, FileText, Link2, BarChart2 } from "lucide-react";
import { ComposedChart, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useGa4 } from "../../hooks/useMetrics";
import { useClientContext } from "../../contexts/ClientContext";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import MetricCard from "../../components/ui/MetricCard";
import SectionHeader from "../../components/ui/SectionHeader";
import CustomTooltip from "../../components/ui/CustomTooltip";
import DataTable from "../../components/ui/DataTable";
import MonthNav from "../../components/ui/MonthNav";
import { C } from "../../utils/colors";
import { fmt, calcVar } from "../../utils/format";

export default function Ga4Tab() {
  const clientId = useClientContext();
  const { data, loading, error } = useGa4(clientId);
  const [mi, setMi] = useState(Infinity);
  const [showConsolidado, setShowConsolidado] = useState(false);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { metrics, pages, origins } = data;
  if (!metrics?.length) return <ErrorState message="Nenhum dado disponível. Clique em Sincronizar para buscar os dados." />;

  const safeMi = Math.min(mi, metrics.length - 1);
  const m = metrics[safeMi];
  const monthKey = metrics[safeMi]?.month;
  const n = metrics.length;

  // ── Consolidado (aggregate across all months) ──────────────────────────────
  const consol = {
    usuariosTotais:        Math.round(metrics.reduce((s, x) => s + x.usuariosTotais, 0) / n),
    usuariosAtivos:        Math.round(metrics.reduce((s, x) => s + x.usuariosAtivos, 0) / n),
    novosUsuarios:         metrics.reduce((s, x) => s + x.novosUsuarios, 0),
    sessoes:               metrics.reduce((s, x) => s + x.sessoes, 0),
    sessoesEngajadas:      metrics.reduce((s, x) => s + x.sessoesEngajadas, 0),
    taxaEngajamento:       parseFloat((metrics.reduce((s, x) => s + x.taxaEngajamento, 0) / n).toFixed(1)),
    tempoMedioEngajamento: Math.round(metrics.reduce((s, x) => s + x.tempoMedioEngajamento, 0) / n),
    viewsPorSessao:        parseFloat((metrics.reduce((s, x) => s + x.viewsPorSessao, 0) / n).toFixed(2)),
    numEventos:            metrics.reduce((s, x) => s + x.numEventos, 0),
  };
  const consolPeriodo = `${metrics[0]?.monthLabel} – ${metrics[n - 1]?.monthLabel}`;

  const cur = showConsolidado ? consol : m;

  // ── Chart data (always all months) ────────────────────────────────────────
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

  // ── Tables — month or consolidado ─────────────────────────────────────────
  const paginasRows = showConsolidado
    ? pages
        .map(p => {
          const total = p.metrics.reduce((s, pm) => s + (pm.views || 0), 0);
          const mets  = p.metrics.filter(pm => pm.tempoMedio != null);
          const avg   = mets.length ? Math.round(mets.reduce((s, pm) => s + pm.tempoMedio, 0) / mets.length) : null;
          return { label: p.label, views: total, tempo: avg };
        })
        .filter(r => r.views > 0)
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
        .map(r => [r.label, fmt(r.views), r.tempo != null ? r.tempo + "s" : "—"])
    : pages
        .map(p => {
          const met = p.metrics.find(pm => pm.month === monthKey);
          return [p.label, met?.views != null ? fmt(met.views) : "—", met?.tempoMedio != null ? met.tempoMedio + "s" : "—"];
        })
        .filter(r => r[1] !== "—");

  const origensRows = showConsolidado
    ? origins
        .map(o => {
          const total    = o.metrics.reduce((s, om) => s + (om.sessoes || 0), 0);
          const taxaMets = o.metrics.filter(om => om.taxaEng != null);
          const avgTaxa  = taxaMets.length ? parseFloat((taxaMets.reduce((s, om) => s + om.taxaEng, 0) / taxaMets.length).toFixed(1)) : null;
          const tmpMets  = o.metrics.filter(om => om.tempoMedio != null);
          const avgTmp   = tmpMets.length ? Math.round(tmpMets.reduce((s, om) => s + om.tempoMedio, 0) / tmpMets.length) : null;
          return { fonte: o.fonte, sess: total, taxa: avgTaxa, tempo: avgTmp };
        })
        .filter(r => r.sess > 0)
        .sort((a, b) => b.sess - a.sess)
        .slice(0, 10)
        .map(r => [r.fonte, fmt(r.sess), r.taxa != null ? r.taxa + "%" : "—", r.tempo != null ? r.tempo + "s" : "—"])
    : origins
        .map(o => {
          const met = o.metrics.find(om => om.month === monthKey);
          if (!met || met.sessoes == null) return null;
          return [o.fonte, fmt(met.sessoes), met.taxaEng != null ? met.taxaEng + "%" : "—", met.tempoMedio != null ? met.tempoMedio + "s" : "—"];
        })
        .filter(Boolean);

  // Top 3 pages evolution
  const top3Pages = pages.slice(0, 3);
  const pagesEvoData = metrics.map(met => {
    const d = { mes: met.monthLabel?.split("/")[0] };
    top3Pages.forEach(p => { d[p.label] = p.metrics.find(pm => pm.month === met.month)?.views ?? null; });
    return d;
  });

  // Google vs Direto
  const googleOrigin = origins.find(o => o.fonte?.toLowerCase().includes("google"));
  const directOrigin = origins.find(o => o.fonte?.toLowerCase().includes("direct") || o.fonte === "(direct)");
  const originsEvoData = metrics.map(met => {
    const d = { mes: met.monthLabel?.split("/")[0] };
    if (googleOrigin) d["Google"] = googleOrigin.metrics.find(om => om.month === met.month)?.sessoes ?? null;
    if (directOrigin) d["Direto"] = directOrigin.metrics.find(om => om.month === met.month)?.sessoes ?? null;
    return d;
  });

  const sectionSub = showConsolidado ? consolPeriodo : metrics[safeMi]?.monthLabel;

  return (
    <>
      {/* 9 KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 8 }}>
        <MetricCard title="Usuários Totais"  value={fmt(cur.usuariosTotais)}          variation={showConsolidado ? null : calcVar(totais,  safeMi)} icon={Users}      color={C.ga4}          small subtitle={showConsolidado ? "média/mês" : null} />
        <MetricCard title="Usuários Ativos"  value={fmt(cur.usuariosAtivos)}          variation={showConsolidado ? null : calcVar(uAtivos, safeMi)} icon={Activity}   color={C.green}        small subtitle={showConsolidado ? "média/mês" : null} />
        <MetricCard title="Novos Usuários"   value={fmt(cur.novosUsuarios)}           variation={showConsolidado ? null : calcVar(novos,   safeMi)} icon={TrendingUp}  color={C.cyan}         small subtitle={showConsolidado ? "total" : null} />
        <MetricCard title="Sessões"          value={fmt(cur.sessoes)}                 variation={showConsolidado ? null : calcVar(sessoes, safeMi)} icon={Globe}       color={C.purple}       small subtitle={showConsolidado ? "total" : null} />
        <MetricCard title="Sess. Engajadas"  value={fmt(cur.sessoesEngajadas)}        variation={showConsolidado ? null : calcVar(sesEng,  safeMi)} icon={Target}      color={C.accent}       small subtitle={showConsolidado ? "total" : null} />
        <MetricCard title="Taxa Engajam."    value={cur.taxaEngajamento + "%"}        variation={showConsolidado ? null : safeMi > 0 ? (cur.taxaEngajamento - metrics[safeMi - 1].taxaEngajamento).toFixed(1) : null} icon={Zap} color={C.primaryLight} subtitle={showConsolidado ? "média" : "pp"} small />
        <MetricCard title="Tempo Médio/User" value={cur.tempoMedioEngajamento + "s"}  variation={showConsolidado ? null : calcVar(tempo,   safeMi)} icon={Clock}       color={C.orange}       small subtitle={showConsolidado ? "média" : null} />
        <MetricCard title="Views/Sessão"     value={cur.viewsPorSessao?.toString()}   variation={showConsolidado ? null : calcVar(views,   safeMi)} icon={Eye}         color={C.instagram}    small subtitle={showConsolidado ? "média" : null} />
        <MetricCard title="Nº Eventos"       value={fmt(cur.numEventos)}              variation={showConsolidado ? null : calcVar(eventos, safeMi)} icon={Monitor}     color={C.red}          small subtitle={showConsolidado ? "total" : null} />
      </div>

      {showConsolidado && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "8px 14px", background: C.ga4 + "10", borderRadius: 10, border: `1px solid ${C.ga4}25` }}>
          <BarChart2 size={14} color={C.ga4} />
          <span style={{ fontSize: 12, color: C.ga4, fontWeight: 600 }}>{n} meses consolidados — {consolPeriodo}</span>
        </div>
      )}

      <MonthNav
        months={metrics}
        selected={safeMi}
        onSelect={i => { setMi(i); setShowConsolidado(false); }}
        color={showConsolidado ? C.textMuted : C.ga4}
        extra={
          <button
            onClick={() => setShowConsolidado(v => !v)}
            style={{
              padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap",
              background: showConsolidado ? C.ga4 + "25" : C.card,
              color: showConsolidado ? C.ga4 : C.textMuted,
              outline: showConsolidado ? `1px solid ${C.ga4}80` : `1px solid ${C.border}`,
            }}
          >
            ∑ Geral
          </button>
        }
      />

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
          <SectionHeader icon={FileText} title="Páginas Mais Acessadas" subtitle={showConsolidado ? `Acumulado — ${consolPeriodo}` : `Top páginas — ${sectionSub}`} color={C.purple} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px", marginBottom: 12 }}>
            <DataTable headers={["Página", "Visualizações", showConsolidado ? "Tempo Médio" : "Tempo Médio"]} rows={paginasRows} />
            {!showConsolidado && top3Pages.length > 0 && (
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
          <SectionHeader icon={Link2} title="Origem do Tráfego" subtitle={showConsolidado ? `Acumulado — ${consolPeriodo}` : `Fontes de sessões — ${sectionSub}`} color={C.cyan} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px" }}>
            <DataTable headers={["Fonte", "Sessões", "Taxa Engaj.", "Tempo Médio"]} rows={origensRows} />
            {!showConsolidado && (googleOrigin || directOrigin) && (
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
