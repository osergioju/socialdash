import React, { useState } from "react";
import { Users, Eye, Globe, TrendingUp, MapPin, FileText, Info } from "lucide-react";
import { ComposedChart, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useFacebook } from "../../hooks/useMetrics";
import { useClientContext } from "../../contexts/ClientContext";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import MetricCard from "../../components/ui/MetricCard";
import SectionHeader from "../../components/ui/SectionHeader";
import CustomTooltip from "../../components/ui/CustomTooltip";
import MonthNav from "../../components/ui/MonthNav";
import { C } from "../../utils/colors";
import { fmt, calcVar } from "../../utils/format";

function EmptyState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: 240, gap: 10, textAlign: "center", padding: "0 24px",
    }}>
      <Info size={28} color={C.textMuted} />
      <p style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
        Métricas de Página do Facebook ainda não disponíveis
      </p>
      <p style={{ color: C.textMuted, fontSize: 12, margin: 0, maxWidth: 420, lineHeight: 1.6 }}>
        Essa aba depende de uma permissão adicional do Meta (read_insights) que está em processo
        de aprovação. Assim que for concedida e um sync rodar, os dados da Página aparecem aqui.
      </p>
    </div>
  );
}

const CITY_COLORS = [C.facebook, C.accent, C.green, C.purple, C.cyan];

export default function FacebookTab() {
  const clientId = useClientContext();
  const { data, loading, error } = useFacebook(clientId);
  const [mi, setMi] = useState(Infinity);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { metrics = [], posts = [], cities = [] } = data || {};
  if (!metrics.length) return <EmptyState />;

  const safeMi = Math.min(mi, metrics.length - 1);
  const m = metrics[safeMi];

  const segs  = metrics.map(x => x.seguidores);
  const novos = metrics.map(x => x.novosSeguidores);
  const views = metrics.map(x => x.visualizacoesPagina);
  const uniq  = metrics.map(x => x.visualizadoresUnicos);

  const fbData = metrics.map(x => ({
    mes: x.monthLabel?.split("/")[0],
    seguidores: x.seguidores, novos: x.novosSeguidores,
    visualizacoes: x.visualizacoesPagina, visualizadores: x.visualizadoresUnicos,
  }));

  const cityData = cities
    .map(c => ({ cidade: c.name.split(",")[0], seguidores: c.metrics[c.metrics.length - 1]?.seguidores ?? 0 }))
    .filter(c => c.seguidores > 0)
    .sort((a, b) => b.seguidores - a.seguidores);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 20 }}>
        <MetricCard title="Seguidores"       value={fmt(m.seguidores)}            variation={calcVar(segs, safeMi)}  icon={Users} color={C.facebook}      small />
        <MetricCard title="Novos Seguidores" value={fmt(m.novosSeguidores)}       variation={calcVar(novos, safeMi)} icon={TrendingUp} color={C.green}    small />
        <MetricCard title="Visualizações"    value={fmt(m.visualizacoesPagina)}   variation={calcVar(views, safeMi)} icon={Eye} color={C.accent}          small />
        <MetricCard title="Visualiz. Únicos" value={fmt(m.visualizadoresUnicos)}  variation={calcVar(uniq, safeMi)}  icon={Globe} color={C.facebookLight} small />
      </div>

      <MonthNav months={metrics} selected={safeMi} onSelect={setMi} color={C.facebook} />

      <SectionHeader icon={TrendingUp} title="Evolução da Página" subtitle="Seguidores, novos seguidores e visualizações" color={C.facebook} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={fbData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="l" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="r" orientation="right" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar  yAxisId="r" dataKey="visualizacoes" fill={C.facebook + "35"} name="Visualizações" radius={[4, 4, 0, 0]} />
            <Line yAxisId="l" type="monotone" dataKey="seguidores" stroke={C.facebookLight} strokeWidth={3} dot={{ r: 4, fill: C.facebookLight }} name="Seguidores" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {cityData.length > 0 && (
        <>
          <SectionHeader icon={MapPin} title="Cidades com Mais Seguidores" subtitle="Distribuição geográfica" color={C.facebookLight} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px", marginBottom: 12 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cityData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="cidade" tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="seguidores" name="Seguidores" radius={[0, 6, 6, 0]}>
                  {cityData.map((_, i) => <Cell key={i} fill={CITY_COLORS[i % CITY_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {posts.length > 0 && (
        <>
          <SectionHeader icon={FileText} title="Posts em Destaque" subtitle="Publicações mais recentes da Página" color={C.facebook} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px", display: "flex", flexDirection: "column", gap: 10 }}>
            {posts.slice(0, 15).map((p, i) => (
              <div key={p.id || i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "10px 0", borderBottom: i < 14 ? `1px solid ${C.border}66` : "none" }}>
                <span style={{ fontSize: 11, color: C.textDim, fontFamily: "monospace", whiteSpace: "nowrap", minWidth: 70 }}>
                  {new Date(p.timestamp).toLocaleDateString("pt-BR")}
                </span>
                <span style={{ fontSize: 12, color: C.text, lineHeight: 1.5, flex: 1 }}>
                  {(p.message || "(sem texto)").slice(0, 140).replace(/\n/g, " ")}{(p.message || "").length > 140 ? "…" : ""}
                </span>
                <span style={{ fontSize: 10, color: C.textMuted, whiteSpace: "nowrap" }}>
                  👍{fmt(p.likes)} 💬{fmt(p.comments)} ↗{fmt(p.shares)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
