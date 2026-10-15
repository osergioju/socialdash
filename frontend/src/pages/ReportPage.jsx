import React from "react";
import { useParams, Link } from "react-router-dom";
import { Download, ArrowLeft, RefreshCw, Users, Eye, Heart, Globe, TrendingUp, AlertTriangle, ListChecks } from "lucide-react";
import { useClient } from "../hooks/useClients";
import { useClientAuth } from "../contexts/ClientAuthContext";
import {
  useOverview, useInstagram, useInstagramStories, useFacebook,
  useLinkedin, useLinkedinPosts, useGa4, useGa4Detail, useNarrative,
} from "../hooks/useMetrics";
import { LoadingState, ErrorState } from "../components/ui/LoadingState";
import MetricCard from "../components/ui/MetricCard";
import { C } from "../utils/colors";
import { fmt } from "../utils/format";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function findMonth(metrics, month) {
  if (!metrics?.length) return null;
  return metrics.find((m) => m.month === month) || metrics[metrics.length - 1];
}

function Section({ title, color, children, lastOfPage }) {
  return (
    <section className={lastOfPage ? "report-page-break" : undefined} style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 12px", paddingBottom: 8, borderBottom: `2px solid ${color}` }}>{title}</h2>
      {children}
    </section>
  );
}

function NarrativeBlock({ label, text, color }) {
  if (!text) return null;
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

export default function ReportPage() {
  const { id, slug, month: monthParam } = useParams();
  const month = monthParam || currentMonth();
  const isPortal = !!slug;

  const agency = useClient(isPortal ? null : id);
  const portal = useClientAuth();

  const clientId   = isPortal ? portal.client?.id   : id;
  const clientName = isPortal ? portal.client?.name : agency.client?.name;
  const backHref    = isPortal ? `/c/${slug}` : `/clients/${id}/dashboard`;

  const overview   = useOverview(clientId);
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

  const igMonth  = findMonth(ig.data?.metrics, month);
  const fbMonth  = findMonth(fb.data?.metrics, month);
  const liMonth  = findMonth(li.data?.metrics, month);
  const ga4Month = findMonth(ga4.data?.metrics, month);

  const monthLabel = igMonth?.monthLabel || liMonth?.monthLabel || ga4Month?.monthLabel || month;

  const igPostsOfMonth = (ig.data?.posts || []).filter((p) => p.month === month).sort((a, b) => (b.reach || 0) - (a.reach || 0));
  const storiesOfMonth = (igStories.data?.stories || []).filter((s) => s.month === month);
  const fbPostsOfMonth = (fb.data?.posts || []).filter((p) => p.month === month);
  const liPostsOfMonth = (liPosts.data?.posts || []).filter((p) => p.month === month);

  const report = narrative.data?.report;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      {/* Barra de ações — some na impressão */}
      <div className="report-no-print" style={{ position: "sticky", top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to={backHref} style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMuted, fontSize: 13, textDecoration: "none" }}>
          <ArrowLeft size={15} /> Voltar ao dashboard
        </Link>
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

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 60px" }}>
        {/* Capa */}
        <div className="report-page-break" style={{ textAlign: "center", padding: "50px 0 36px" }}>
          <div style={{ fontSize: 12, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Relatório de Desempenho</div>
          <h1 style={{ fontSize: 34, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{clientName || "Cliente"}</h1>
          <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>Período de referência: {monthLabel}</p>
        </div>

        {/* Narrativa */}
        <Section title="Resumo do Mês" color={C.primary}>
          {narrative.loading || narrative.generating ? (
            <p style={{ color: C.textMuted, fontSize: 13 }}>Gerando narrativa por IA...</p>
          ) : report ? (
            <>
              <NarrativeBlock label="O mês em resumo"        text={report.resumoMes}          color={C.primary} />
              <NarrativeBlock label="Destaque — Instagram"   text={report.destaqueInstagram}  color={C.instagram} />
              <NarrativeBlock label="Destaque — Facebook"    text={report.destaqueFacebook}   color={C.facebook} />
              <NarrativeBlock label="Destaque — LinkedIn"    text={report.destaqueLinkedin}   color={C.linkedin} />
              <NarrativeBlock label="Ponto de atenção"       text={report.pontoDeAtencao}     color={C.accent} />
              {Array.isArray(report.proximosPassos) && report.proximosPassos.length > 0 && (
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.green}`, borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><ListChecks size={12} /> Próximos passos</div>
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
        </Section>

        {/* Instagram */}
        {igMonth && (
          <Section title="Instagram" color={C.instagram} lastOfPage>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
              <MetricCard title="Seguidores"  value={fmt(igMonth.seguidores)}      icon={Users} color={C.instagram} small />
              <MetricCard title="Alcance"     value={fmt(igMonth.alcanceOrganico)} icon={Eye}   color={C.green}     small />
              <MetricCard title="Interações"  value={fmt(igMonth.interacoes)}      icon={Heart} color={C.accent}    small />
              <MetricCard title="Stories"     value={fmt(storiesOfMonth.length || igMonth.storiesQtd)} icon={Eye}  color={C.purple}   small />
            </div>
            {igPostsOfMonth.length > 0 && (
              <>
                <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 8px", fontWeight: 600 }}>Posts em destaque do mês</h4>
                {igPostsOfMonth.slice(0, 3).map((p) => (
                  <div key={p.id} style={{ fontSize: 12, color: C.textMuted, padding: "6px 0", borderBottom: `1px solid ${C.border}66` }}>
                    {(p.caption || "(sem legenda)").slice(0, 90)} — alcance {fmt(p.reach)}, curtidas {fmt(p.likes)}
                  </div>
                ))}
              </>
            )}
          </Section>
        )}

        {/* Facebook */}
        {fbMonth ? (
          <Section title="Facebook (Página)" color={C.facebook} lastOfPage>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
              <MetricCard title="Seguidores"    value={fmt(fbMonth.seguidores)}           icon={Users} color={C.facebook} small />
              <MetricCard title="Novos"         value={fmt(fbMonth.novosSeguidores)}      icon={TrendingUp} color={C.green} small />
              <MetricCard title="Visualizações" value={fmt(fbMonth.visualizacoesPagina)}  icon={Eye} color={C.accent} small />
            </div>
            {fbPostsOfMonth.length > 0 && (
              <>
                <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 8px", fontWeight: 600 }}>Posts em destaque do mês</h4>
                {fbPostsOfMonth.slice(0, 3).map((p) => (
                  <div key={p.id} style={{ fontSize: 12, color: C.textMuted, padding: "6px 0", borderBottom: `1px solid ${C.border}66` }}>
                    {(p.message || "(sem texto)").slice(0, 90)} — curtidas {fmt(p.likes)}, comentários {fmt(p.comments)}
                  </div>
                ))}
              </>
            )}
          </Section>
        ) : (
          <Section title="Facebook (Página)" color={C.facebook} lastOfPage>
            <p style={{ color: C.textMuted, fontSize: 12 }}>
              Sem dados neste mês — depende da permissão read_insights do Meta, em processo de aprovação.
            </p>
          </Section>
        )}

        {/* LinkedIn */}
        {liMonth && (
          <Section title="LinkedIn" color={C.linkedin} lastOfPage>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
              <MetricCard title="Seguidores"  value={fmt(liMonth.seguidores)}  icon={Users} color={C.linkedin} small />
              <MetricCard title="Alcance"     value={fmt(liMonth.alcance)}     icon={Eye}   color={C.green}    small />
              <MetricCard title="Impressões"  value={fmt(liMonth.impressoes)}  icon={Globe} color={C.primary}  small />
              <MetricCard title="Engajamento" value={fmt(liMonth.engajamento)} icon={Heart} color={C.accent}   small />
            </div>
            {liPostsOfMonth.length > 0 && (
              <>
                <h4 style={{ fontSize: 12, color: C.textMuted, margin: "0 0 8px", fontWeight: 600 }}>Posts do mês (sem métricas por post neste tier da API)</h4>
                {liPostsOfMonth.slice(0, 3).map((p) => (
                  <div key={p.id} style={{ fontSize: 12, color: C.textMuted, padding: "6px 0", borderBottom: `1px solid ${C.border}66` }}>
                    {(p.commentary || "(sem texto)").slice(0, 90)}
                  </div>
                ))}
              </>
            )}
          </Section>
        )}

        {/* Site / GA4 */}
        {ga4Month && (
          <Section title="Site / Google Analytics 4" color={C.ga4}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
              <MetricCard title="Usuários Ativos" value={fmt(ga4Month.usuariosAtivos)}    icon={Users}  color={C.ga4}    small />
              <MetricCard title="Sessões"         value={fmt(ga4Month.sessoes)}           icon={Globe}  color={C.purple} small />
              <MetricCard title="Taxa Engajam."   value={ga4Month.taxaEngajamento + "%"}  icon={TrendingUp} color={C.green} small />
              <MetricCard title="Eventos"         value={fmt(ga4Month.numEventos)}        icon={Eye}    color={C.accent} small />
            </div>
          </Section>
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
          .report-page-break { page-break-after: always; }
          body, html { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}
