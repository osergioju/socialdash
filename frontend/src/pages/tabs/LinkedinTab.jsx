import React, { useState } from "react";
import { Users, Eye, Heart, MousePointerClick, BarChart3, Briefcase } from "lucide-react";
import { ComposedChart, Line, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { useLinkedin } from "../../hooks/useMetrics";
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

export default function LinkedinTab() {
  const { data, loading, error } = useLinkedin();
  const [mi, setMi] = useState(9);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { metrics, cities, industries, roles } = data;
  if (!metrics?.length) return <ErrorState message="Nenhum dado disponível" />;
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

  const PIE_COLORS = [C.linkedin, C.linkedinLight, C.primary, C.primaryLight, C.cyan];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 20 }}>
        <MetricCard title="Seguidores"  value={m.seguidores.toLocaleString()} variation={calcVar(segs, safeMi)}  icon={Users}            color={C.linkedin} small />
        <MetricCard title="Alcance"     value={fmt(m.alcance)}               variation={calcVar(alcs, safeMi)}  icon={Eye}              color={C.linkedinLight} small />
        <MetricCard title="Impressões"  value={fmt(m.impressoes)}            variation={calcVar(imps, safeMi)}  icon={BarChart3}        color={C.primary}  small />
        <MetricCard title="Engajamento" value={fmt(m.engajamento)}           variation={calcVar(engs, safeMi)}  icon={Heart}            color={C.accent}   small />
        <MetricCard title="Cliques"     value={fmt(m.cliques)}               variation={calcVar(clis, safeMi)}  icon={MousePointerClick} color={C.green}   small />
        <MetricCard title="Reações"     value={fmt(m.reacoes)}               variation={calcVar(reacs, safeMi)} icon={Heart}            color={C.orange}   small />
      </div>

      <MonthSelector months={metrics} selected={safeMi} onSelect={setMi} color={C.linkedin} />

      <SectionHeader icon={Eye} title="Alcance & Impressões" subtitle="Evolução mensal" color={C.linkedin} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={liData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="l" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="r" orientation="right" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar  yAxisId="r" dataKey="impressoes" fill={C.linkedin + "35"} name="Impressões" radius={[4,4,0,0]} />
            <Line yAxisId="l" type="monotone" dataKey="alcance" stroke={C.linkedinLight} strokeWidth={3} dot={{ r: 4, fill: C.linkedinLight }} name="Alcance" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <SectionHeader icon={Heart} title="Engajamento & Cliques" subtitle="Interações mensais" color={C.accent} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={liData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="engajamento" fill={C.linkedin}   name="Engajamento" radius={[4,4,0,0]} />
            <Bar dataKey="cliques"     fill={C.linkedinLight + "aa"} name="Cliques" radius={[4,4,0,0]} />
            <Bar dataKey="reacoes"     fill={C.primary}    name="Reações"     radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 14px", fontWeight: 600 }}>Setores da Audiência</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={industries} dataKey="seguidores" nameKey="nome" cx="50%" cy="50%" outerRadius={80} label={({ nome, percent }) => `${nome.split(" ")[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {industries.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 14px", fontWeight: 600 }}>Funções Profissionais</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={roles} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nome" tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="seguidores" name="Seguidores" radius={[0,6,6,0]}>
                {roles.map((_, i) => <Cell key={i} fill={i === 0 ? C.linkedin : C.linkedin + "80"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SectionHeader icon={Users} title="Top Regiões — Seguidores" subtitle={`Por número de seguidores em ${metrics[safeMi]?.monthLabel}`} color={C.linkedin} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px" }}>
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
    </>
  );
}
