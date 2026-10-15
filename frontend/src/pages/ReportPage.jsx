import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Download, ArrowLeft, RefreshCw, Users, Eye, Heart, Globe, TrendingUp, MapPin,
  AlertTriangle, ListChecks, Instagram, Linkedin, Facebook, BookOpen, UserRound,
  MousePointerClick, Video, FileText,
} from "lucide-react";
import {
  ComposedChart, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useClient } from "../hooks/useClients";
import { useClientAuth } from "../contexts/ClientAuthContext";
import {
  useInstagram, useInstagramStories, useFacebook,
  useLinkedin, useLinkedinPosts, useGa4, useGa4Detail, useNarrative,
} from "../hooks/useMetrics";
import { LoadingState, ErrorState } from "../components/ui/LoadingState";
import MetricCard from "../components/ui/MetricCard";
import SectionHeader from "../components/ui/SectionHeader";
import CustomTooltip from "../components/ui/CustomTooltip";
import DataTable from "../components/ui/DataTable";
import MonthNav from "../components/ui/MonthNav";
import { C } from "../utils/colors";
import { fmt, calcVar } from "../utils/format";

const MEDIA_LABEL = { IMAGE: "Feed", CAROUSEL_ALBUM: "Carrossel", REEL: "Reel", VIDEO: "Vídeo", status: "Post" };

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function sortMonths(metrics) {
  return [...(metrics || [])].sort((a, b) => a.month.localeCompare(b.month));
}

function monthIdx(sorted, month) {
  const i = sorted.findIndex((m) => m.month === month);
  return i === -1 ? sorted.length - 1 : i;
}

function topCities(cities, month, limit = 5) {
  return (cities || [])
    .map((c) => ({ name: c.name.split(",")[0], value: c.metrics.find((m) => m.month === month)?.seguidores ?? 0 }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function topDetailRows(items, labelFn, month, limit = 5) {
  return (items || [])
    .map((it) => {
      const met = it.metrics.find((m) => m.month === month);
      return met ? { label: labelFn(it), sessoes: met.sessoes ?? 0, usuarios: met.usuarios ?? 0 } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.sessoes - a.sessoes)
    .slice(0, limit);
}

function Page({ children, pageBreak }) {
  return <section className={pageBreak ? "report-page-break" : undefined} style={{ marginBottom: 36 }}>{children}</section>;
}

function Card({ children, style }) {
  return <div className="report-avoid-break" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 14, ...style }}>{children}</div>;
}

function MiniBarList({ items, color }) {
  const max = Math.max(...items.map((i) => i.value || 0), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {items.map((item, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 12, color: C.text }}>{item.name}</span>
            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>{item.value.toLocaleString("pt-BR")}</span>
          </div>
          <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
            <div style={{ height: "100%", width: `${(item.value / max) * 100}%`, background: `linear-gradient(90deg, ${color}, ${color}99)`, borderRadius: 3 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PostCard({ type, caption, color, stats }) {
  return (
    <div className="report-avoid-break" style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", flex: "1 1 220px", minWidth: 200 }}>
      <div style={{ display: "inline-block", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color, background: color + "20", borderRadius: 5, padding: "2px 7px", marginBottom: 8 }}>
        {type}
      </div>
      <p style={{ fontSize: 12, color: C.text, margin: "0 0 10px", lineHeight: 1.5, minHeight: 36 }}>{caption}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {stats.map(([label, val], i) => (
          <div key={i}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{fmt(val)}</div>
            <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NarrativeBlock({ label, text, color }) {
  if (!text) return null;
  return (
    <div className="report-avoid-break" style={{ background: C.bg, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

export default function ReportPage() {
  const { id, slug, month: monthParam } = useParams();
  const navigate = useNavigate();
  const month = monthParam || currentMonth();
  const isPortal = !!slug;

  const agency = useClient(isPortal ? null : id);
  const portal = useClientAuth();

  const clientId   = isPortal ? portal.client?.id   : id;
  const clientName = isPortal ? portal.client?.name : agency.client?.name;
  const backHref    = isPortal ? `/c/${slug}` : `/clients/${id}/dashboard`;
  const reportsBase = isPortal ? `/c/${slug}/reports` : `/clients/${id}/reports`;

  const ig         = useInstagram(clientId);
  const igStories  = useInstagramStories(clientId);
  const fb         = useFacebook(clientId);
  const li         = useLinkedin(clientId);
  const liPosts    = useLinkedinPosts(clientId);
  const ga4        = useGa4(clientId);
  const ga4Detail  = useGa4Detail(clientId);
  const narrative  = useNarrative(clientId, month);

  const loadingCore = ig.loading || li.loading || ga4.loading;
  if (!clientId || loadingCore) return <LoadingState message="Montando relatório..." />;
  if (ig.error)  return <ErrorState message={ig.error} />;
  if (li.error)  return <ErrorState message={li.error} />;
  if (ga4.error) return <ErrorState message={ga4.error} />;

  // ── Instagram ──────────────────────────────────────────────────────────
  const igSorted = sortMonths(ig.data?.metrics);
  const igI      = monthIdx(igSorted, month);
  const igMonth  = igSorted[igI];
  const igChart  = igSorted.map((x) => ({ mes: x.monthLabel, alcance: x.alcanceOrganico, visualizacoes: x.visualizacoes }));
  const igCities = topCities(ig.data?.cities, month);
  const igPostsOfMonth = (ig.data?.posts || []).filter((p) => p.month === month).sort((a, b) => (b.reach || 0) - (a.reach || 0));
  const storiesOfMonth = (igStories.data?.stories || []).filter((s) => s.month === month);
  const igAge    = igStories.data?.demographics?.age || [];
  const igGender = igStories.data?.demographics?.gender || [];

  // ── Facebook ───────────────────────────────────────────────────────────
  const fbSorted = sortMonths(fb.data?.metrics);
  const fbI      = monthIdx(fbSorted, month);
  const fbMonth  = fbSorted[fbI];
  const fbChart  = fbSorted.map((x) => ({ mes: x.monthLabel, seguidores: x.seguidores, visualizacoes: x.visualizacoesPagina }));
  const fbCities = topCities(fb.data?.cities, month);
  const fbPostsOfMonth = (fb.data?.posts || []).filter((p) => p.month === month);

  // ── LinkedIn ───────────────────────────────────────────────────────────
  const liSorted = sortMonths(li.data?.metrics);
  const liI      = monthIdx(liSorted, month);
  const liMonth  = liSorted[liI];
  const liChart  = liSorted.map((x) => ({ mes: x.monthLabel?.split("/")[0], impressoes: x.impressoes, alcance: x.alcance, engajamento: x.engajamento }));
  const liCities = topCities(li.data?.cities, month);
  const liIndustries = (li.data?.industries || []).slice(0, 5).map((i) => ({ name: i.nome, value: i.seguidores }));
  const liRoles = (li.data?.roles || []).slice(0, 5).map((r) => ({ name: r.nome, value: r.seguidores }));
  const liPostsOfMonth = (liPosts.data?.posts || []).filter((p) => p.month === month);

  // ── GA4 ────────────────────────────────────────────────────────────────
  const ga4Sorted = sortMonths(ga4.data?.metrics);
  const ga4I      = monthIdx(ga4Sorted, month);
  const ga4Month  = ga4Sorted[ga4I];
  const ga4Chart  = ga4Sorted.map((x) => ({ mes: x.monthLabel?.split("/")[0], usuarios: x.usuariosAtivos, sessoes: x.sessoes }));
  const topPages   = (ga4.data?.pages   || []).map((p) => ({ label: p.label, v: p.metrics.find((m) => m.month === month)?.views ?? 0 })).filter((p) => p.v > 0).sort((a, b) => b.v - a.v).slice(0, 5);
  const topOrigins = (ga4.data?.origins || []).map((o) => ({ label: o.fonte, v: o.metrics.find((m) => m.month === month)?.sessoes ?? 0 })).filter((o) => o.v > 0).sort((a, b) => b.v - a.v).slice(0, 5);
  const detail = ga4Detail.data;
  const geoRows     = detail ? topDetailRows(detail.geo,      (g) => `${g.cidade}, ${g.pais}`, month) : [];
  const deviceRows  = detail ? topDetailRows(detail.devices,  (d) => d.categoria, month) : [];
  const channelRows = detail ? topDetailRows(detail.channels, (c) => c.canal, month) : [];
  const campaignRows= detail ? topDetailRows(detail.campaigns,(c) => c.origemMidia, month) : [];

  const monthLabel = igMonth?.monthLabel || liMonth?.monthLabel || ga4Month?.monthLabel || month;
  const report = narrative.data?.report;
  // ── Seletor de mês: união dos meses disponíveis em qualquer plataforma ───
  const allMonthsMap = new Map();
  for (const arr of [igSorted, fbSorted, liSorted, ga4Sorted]) {
    for (const m of arr) if (!allMonthsMap.has(m.month)) allMonthsMap.set(m.month, m.monthLabel);
  }
  const allMonths = Array.from(allMonthsMap, ([month, monthLabel]) => ({ month, monthLabel })).sort((a, b) => a.month.localeCompare(b.month));
  const monthSelIdx = allMonths.findIndex((m) => m.month === month);
  const goToMonth = (i) => navigate(`${reportsBase}/${allMonths[i].month}`);

  return (
    <div className="report-root" style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      {/* Barra de ações — some na impressão */}
      <div className="report-no-print" style={{ position: "sticky", top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to={backHref} style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMuted, fontSize: 13, textDecoration: "none" }}>
          <ArrowLeft size={15} /> Voltar ao dashboard
        </Link>
        {allMonths.length > 0 && (
          <div style={{ marginBottom: -22 }}>
            <MonthNav months={allMonths} selected={monthSelIdx < 0 ? allMonths.length - 1 : monthSelIdx} onSelect={goToMonth} color={C.primary} />
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={narrative.regenerate}
            disabled={narrative.generating}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: narrative.generating ? "not-allowed" : "pointer" }}
          >
            <RefreshCw size={13} style={{ animation: narrative.generating ? "spin 1s linear infinite" : "none" }} />
            {narrative.generating ? "Gerando narrativa..." : "Regenerar narrativa"}
          </button>
          <button
            onClick={() => window.print()}
            style={{ display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            <Download size={14} /> Exportar PDF
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 24px 60px" }}>
        {/* Capa */}
        <div className="report-page-break" style={{ textAlign: "center", padding: "70px 0 40px", background: `radial-gradient(circle at 50% 0%, ${C.primary}18, transparent 60%)` }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", fontWeight: 900, fontSize: 20, color: "#fff" }}>
            {(clientName || "?")[0].toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>Relatório de Desempenho</div>
          <h1 style={{ fontSize: 38, fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.02em" }}>{clientName || "Cliente"}</h1>
          <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>Período de referência: {monthLabel}</p>
        </div>

        {/* Resumo consolidado — mesmos dados por mês já usados nas seções abaixo,
            não o useOverview (que é sempre "mês mais recente", não respeita o seletor) */}
        {(igMonth || liMonth || ga4Month) && (
          <Page>
            <SectionHeader icon={TrendingUp} title="Resumo Consolidado" subtitle={`${monthLabel} comparado ao mês anterior`} color={C.primary} />
            <div className="report-avoid-break" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <MetricCard title="Seguidores IG"  value={igMonth && fmt(igMonth.seguidores)}       variation={igMonth && calcVar(igSorted.map(x => x.seguidores), igI)}        icon={Users} color={C.instagram} />
              <MetricCard title="Seguidores LI"  value={liMonth && fmt(liMonth.seguidores)}       variation={liMonth && calcVar(liSorted.map(x => x.seguidores), liI)}        icon={Users} color={C.linkedin} />
              <MetricCard title="Alcance IG"     value={igMonth && fmt(igMonth.alcanceOrganico)}  variation={igMonth && calcVar(igSorted.map(x => x.alcanceOrganico), igI)}   icon={Eye}   color={C.green} />
              <MetricCard title="Engajamento LI" value={liMonth && fmt(liMonth.engajamento)}      variation={liMonth && calcVar(liSorted.map(x => x.engajamento), liI)}       icon={Heart} color={C.accent} />
              <MetricCard title="Views IG"       value={igMonth && fmt(igMonth.visualizacoes)}    variation={igMonth && calcVar(igSorted.map(x => x.visualizacoes), igI)}     icon={Eye}   color={C.purple} />
              <MetricCard title="Usuários Site"  value={ga4Month && fmt(ga4Month.usuariosAtivos)} variation={ga4Month && calcVar(ga4Sorted.map(x => x.usuariosAtivos), ga4I)} icon={Globe} color={C.ga4} />
            </div>
          </Page>
        )}

        {/* Narrativa */}
        <Page>
          <SectionHeader icon={ListChecks} title="O Mês em Palavras" subtitle="Gerado por IA a partir dos números do período" color={C.accent} />
          {narrative.loading || narrative.generating ? (
            <p style={{ color: C.textMuted, fontSize: 13 }}>Gerando narrativa por IA...</p>
          ) : report ? (
            <>
              <NarrativeBlock label="O mês em resumo"      text={report.resumoMes}         color={C.primary} />
              <NarrativeBlock label="Destaque — Instagram" text={report.destaqueInstagram} color={C.instagram} />
              <NarrativeBlock label="Destaque — Facebook"  text={report.destaqueFacebook}  color={C.facebook} />
              <NarrativeBlock label="Destaque — LinkedIn"  text={report.destaqueLinkedin}  color={C.linkedin} />
              <NarrativeBlock label="Ponto de atenção"     text={report.pontoDeAtencao}    color={C.orange} />
              {Array.isArray(report.proximosPassos) && report.proximosPassos.length > 0 && (
                <div className="report-avoid-break" style={{ background: C.bg, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.green}`, borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, fontWeight: 600 }}>Próximos passos</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: C.text, lineHeight: 1.7 }}>
                    {report.proximosPassos.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: narrative.error ? C.red : C.textMuted, fontSize: 13 }}>
              {narrative.error || "Sem narrativa gerada para este mês ainda."}
            </p>
          )}
        </Page>

        {/* Instagram */}
        {igMonth && (
          <Page pageBreak>
            <SectionHeader icon={Instagram} title="Instagram" subtitle={monthLabel} color={C.instagram} />
            <div className="report-avoid-break" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
              <MetricCard title="Seguidores"  value={fmt(igMonth.seguidores)}      variation={calcVar(igSorted.map(x => x.seguidores), igI)}      icon={Users}            color={C.instagram} small />
              <MetricCard title="Alcance"     value={fmt(igMonth.alcanceOrganico)} variation={calcVar(igSorted.map(x => x.alcanceOrganico), igI)} icon={Eye}              color={C.green}     small />
              <MetricCard title="Interações"  value={fmt(igMonth.interacoes)}      variation={calcVar(igSorted.map(x => x.interacoes), igI)}      icon={Heart}            color={C.accent}    small />
              <MetricCard title="Visitas Perfil" value={fmt(igMonth.visitasPerfil)} variation={calcVar(igSorted.map(x => x.visitasPerfil), igI)}  icon={MousePointerClick} color={C.purple}    small />
            </div>

            <Card>
              <ResponsiveContainer width="100%" height={190}>
                <ComposedChart data={igChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="l" tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar yAxisId="r" dataKey="visualizacoes" fill={C.instagram + "35"} name="Visualizações" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="l" type="monotone" dataKey="alcance" stroke={C.instagramLight} strokeWidth={2.5} dot={{ r: 3 }} name="Alcance" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            {igPostsOfMonth.length > 0 && (
              <>
                <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 8px", fontWeight: 600 }}>Posts em destaque do mês</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                  {igPostsOfMonth.slice(0, 4).map((p) => (
                    <PostCard
                      key={p.id} color={C.instagram}
                      type={MEDIA_LABEL[p.mediaType] || p.mediaType}
                      caption={p.caption || "(sem legenda)"}
                      stats={[["Alcance", p.reach], ["Curtidas", p.likes], ["Coment.", p.comments]]}
                    />
                  ))}
                </div>
              </>
            )}

            <div style={{ display: "grid", gridTemplateColumns: igCities.length && storiesOfMonth.length ? "1fr 1fr" : "1fr", gap: 14 }}>
              {igCities.length > 0 && (
                <Card>
                  <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} /> Cidades com mais seguidores</h4>
                  <MiniBarList items={igCities} color={C.instagram} />
                </Card>
              )}
              {storiesOfMonth.length > 0 && (
                <Card>
                  <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><BookOpen size={13} /> Stories do mês</h4>
                  <DataTable headers={["Data", "Views", "Saídas"]} rows={storiesOfMonth.slice(0, 6).map((s) => [new Date(s.timestamp).toLocaleDateString("pt-BR"), fmt(s.views), fmt(s.exits)])} />
                </Card>
              )}
            </div>

            {(igAge.length > 0 || igGender.length > 0) && (
              <Card>
                <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><UserRound size={13} /> Demografia da audiência</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={igAge}>
                      <XAxis dataKey="label" tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill={C.cyan} radius={[3, 3, 0, 0]} name="Idade" />
                    </BarChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={igGender}>
                      <XAxis dataKey="label" tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill={C.purple} radius={[3, 3, 0, 0]} name="Gênero" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </Page>
        )}

        {/* Facebook */}
        <Page pageBreak>
          <SectionHeader icon={Facebook} title="Facebook (Página)" subtitle={monthLabel} color={C.facebook} />
          {fbMonth ? (
            <>
              <div className="report-avoid-break" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                <MetricCard title="Seguidores"    value={fmt(fbMonth.seguidores)}          variation={calcVar(fbSorted.map(x => x.seguidores), fbI)}          icon={Users}      color={C.facebook}      small />
                <MetricCard title="Novos"         value={fmt(fbMonth.novosSeguidores)}     variation={calcVar(fbSorted.map(x => x.novosSeguidores), fbI)}     icon={TrendingUp} color={C.green}         small />
                <MetricCard title="Visualizações" value={fmt(fbMonth.visualizacoesPagina)} variation={calcVar(fbSorted.map(x => x.visualizacoesPagina), fbI)} icon={Eye}        color={C.accent}        small />
                <MetricCard title="Visualiz. Únicos" value={fmt(fbMonth.visualizadoresUnicos)} variation={calcVar(fbSorted.map(x => x.visualizadoresUnicos), fbI)} icon={Globe} color={C.facebookLight} small />
              </div>
              <Card>
                <ResponsiveContainer width="100%" height={190}>
                  <ComposedChart data={fbChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="l" tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar yAxisId="r" dataKey="visualizacoes" fill={C.facebook + "35"} name="Visualizações" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="l" type="monotone" dataKey="seguidores" stroke={C.facebookLight} strokeWidth={2.5} dot={{ r: 3 }} name="Seguidores" />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
              {fbPostsOfMonth.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                  {fbPostsOfMonth.slice(0, 4).map((p) => (
                    <PostCard
                      key={p.id} color={C.facebook}
                      type={MEDIA_LABEL[p.mediaType] || p.mediaType}
                      caption={p.message || "(sem texto)"}
                      stats={[["Alcance", p.reach], ["Curtidas", p.likes], ["Coment.", p.comments]]}
                    />
                  ))}
                </div>
              )}
              {fbCities.length > 0 && (
                <Card>
                  <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} /> Cidades com mais seguidores</h4>
                  <MiniBarList items={fbCities} color={C.facebook} />
                </Card>
              )}
            </>
          ) : (
            <p style={{ color: C.textMuted, fontSize: 12 }}>
              Sem dados neste mês — depende da permissão read_insights do Meta, em processo de aprovação.
            </p>
          )}
        </Page>

        {/* LinkedIn */}
        {liMonth && (
          <Page pageBreak>
            <SectionHeader icon={Linkedin} title="LinkedIn" subtitle={monthLabel} color={C.linkedin} />
            <div className="report-avoid-break" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
              <MetricCard title="Seguidores"  value={fmt(liMonth.seguidores)}  variation={calcVar(liSorted.map(x => x.seguidores), liI)}  icon={Users} color={C.linkedin} small />
              <MetricCard title="Alcance"     value={fmt(liMonth.alcance)}     variation={calcVar(liSorted.map(x => x.alcance), liI)}     icon={Eye}   color={C.green}    small />
              <MetricCard title="Impressões"  value={fmt(liMonth.impressoes)}  variation={calcVar(liSorted.map(x => x.impressoes), liI)}  icon={Globe} color={C.primary}  small />
              <MetricCard title="Engajamento" value={fmt(liMonth.engajamento)} variation={calcVar(liSorted.map(x => x.engajamento), liI)} icon={Heart} color={C.accent}   small />
            </div>

            <Card>
              <ResponsiveContainer width="100%" height={190}>
                <ComposedChart data={liChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="l" tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar yAxisId="l" dataKey="impressoes" fill={C.linkedin + "35"} name="Impressões" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="l" type="monotone" dataKey="alcance" stroke={C.linkedinLight} strokeWidth={2.5} dot={{ r: 3 }} name="Alcance" />
                  <Line yAxisId="r" type="monotone" dataKey="engajamento" stroke={C.accent} strokeWidth={2} dot={{ r: 3 }} name="Engajamento" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {liCities.length > 0 && (
                <Card>
                  <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} /> Por região</h4>
                  <MiniBarList items={liCities} color={C.linkedin} />
                </Card>
              )}
              {(liIndustries.length > 0 || liRoles.length > 0) && (
                <Card>
                  <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Por indústria</h4>
                  <MiniBarList items={liIndustries} color={C.accent} />
                </Card>
              )}
            </div>

            {liPostsOfMonth.length > 0 && (
              <Card>
                <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 4px", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><FileText size={13} /> Posts do mês</h4>
                <p style={{ fontSize: 10, color: C.textDim, margin: "0 0 10px" }}>Métricas de engajamento por post individual não disponíveis neste tier da API.</p>
                {liPostsOfMonth.slice(0, 5).map((p, i) => (
                  <div key={p.id || i} style={{ display: "flex", gap: 14, padding: "8px 0", borderBottom: i < liPostsOfMonth.length - 1 ? `1px solid ${C.border}66` : "none" }}>
                    <span style={{ fontSize: 11, color: C.textDim, fontFamily: "monospace", whiteSpace: "nowrap", minWidth: 70 }}>
                      {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("pt-BR") : "—"}
                    </span>
                    <span style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{(p.commentary || "(sem texto)").slice(0, 140)}</span>
                  </div>
                ))}
              </Card>
            )}
          </Page>
        )}

        {/* Site / GA4 */}
        {ga4Month && (
          <Page>
            <SectionHeader icon={Globe} title="Site / Google Analytics 4" subtitle={monthLabel} color={C.ga4} />
            <div className="report-avoid-break" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
              <MetricCard title="Usuários Ativos" value={fmt(ga4Month.usuariosAtivos)} variation={calcVar(ga4Sorted.map(x => x.usuariosAtivos), ga4I)} icon={Users}      color={C.ga4}    small />
              <MetricCard title="Sessões"         value={fmt(ga4Month.sessoes)}        variation={calcVar(ga4Sorted.map(x => x.sessoes), ga4I)}        icon={Globe}      color={C.purple} small />
              <MetricCard title="Taxa Engajam."   value={ga4Month.taxaEngajamento + "%"} icon={TrendingUp} color={C.green} small />
              <MetricCard title="Eventos"         value={fmt(ga4Month.numEventos)}     variation={calcVar(ga4Sorted.map(x => x.numEventos), ga4I)}     icon={Eye}        color={C.accent} small />
            </div>

            <Card>
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={ga4Chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="sessoes"  stroke={C.ga4}   strokeWidth={2}   fill={C.ga4 + "12"}   name="Sessões" />
                  <Area type="monotone" dataKey="usuarios" stroke={C.green} strokeWidth={2}   fill={C.green + "08"} name="Usuários Ativos" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {topPages.length > 0 && (
                <Card>
                  <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Páginas mais acessadas</h4>
                  <DataTable headers={["Página", "Views"]} rows={topPages.map((p) => [p.label, fmt(p.v)])} />
                </Card>
              )}
              {topOrigins.length > 0 && (
                <Card>
                  <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Origem do tráfego</h4>
                  <DataTable headers={["Fonte", "Sessões"]} rows={topOrigins.map((o) => [o.label, fmt(o.v)])} />
                </Card>
              )}
            </div>

            {(geoRows.length > 0 || deviceRows.length > 0 || channelRows.length > 0 || campaignRows.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {geoRows.length > 0 && <Card><h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>País / Cidade</h4><DataTable headers={["Cidade", "Sessões"]} rows={geoRows.map(r => [r.label, fmt(r.sessoes)])} /></Card>}
                {deviceRows.length > 0 && <Card><h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Dispositivo</h4><DataTable headers={["Categoria", "Sessões"]} rows={deviceRows.map(r => [r.label, fmt(r.sessoes)])} /></Card>}
                {channelRows.length > 0 && <Card><h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Canal Padrão</h4><DataTable headers={["Canal", "Sessões"]} rows={channelRows.map(r => [r.label, fmt(r.sessoes)])} /></Card>}
                {campaignRows.length > 0 && <Card><h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>Campanha / Origem-Mídia</h4><DataTable headers={["Origem/Mídia", "Sessões"]} rows={campaignRows.map(r => [r.label, fmt(r.sessoes)])} /></Card>}
              </div>
            )}
          </Page>
        )}

        {!ga4Month && !liMonth && !igMonth && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <AlertTriangle size={20} color={C.textMuted} />
            <p style={{ color: C.textMuted, fontSize: 13 }}>Nenhum dado encontrado para {monthLabel}.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media print {
          .report-no-print { display: none !important; }
          .report-page-break { page-break-before: always; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          body, html { background: ${C.bg} !important; }
          /* Impede que gráficos/cards/blocos de texto sejam cortados ao meio
             entre duas páginas — sem isso o navegador corta onde calhar. */
          .report-avoid-break { break-inside: avoid; page-break-inside: avoid; }
          .report-root h2, .report-root h4 { break-after: avoid; page-break-after: avoid; }
        }
      `}</style>
    </div>
  );
}
