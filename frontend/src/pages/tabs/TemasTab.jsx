import React from "react";
import { Layers, Award, Zap, RefreshCw } from "lucide-react";
import { useInstagram, useLinkedin, useAiInsights } from "../../hooks/useMetrics";
import { useClientContext } from "../../contexts/ClientContext";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import SectionHeader from "../../components/ui/SectionHeader";
import ThemeRankCard from "../../components/ui/ThemeRankCard";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

const PLATFORM_COLOR = {
  instagram: C.instagram,
  linkedin:  C.linkedin,
  ga4:       C.ga4,
  mixed:     C.primary,
};

function platformColor(p) {
  return PLATFORM_COLOR[p] || C.primary;
}

function InsightSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px", borderLeft: `3px solid ${C.border}` }}>
          <div style={{ height: 13, background: C.border, borderRadius: 4, width: "60%", marginBottom: 10 }} />
          <div style={{ height: 10, background: C.border, borderRadius: 4, width: "100%", marginBottom: 6 }} />
          <div style={{ height: 10, background: C.border, borderRadius: 4, width: "80%" }} />
        </div>
      ))}
    </div>
  );
}

export default function TemasTab() {
  const clientId = useClientContext();
  const ig = useInstagram(clientId);
  const li = useLinkedin(clientId);
  const ai = useAiInsights(clientId);

  if (ig.loading || li.loading) return <LoadingState />;
  if (ig.error) return <ErrorState message={ig.error} />;
  if (li.error) return <ErrorState message={li.error} />;

  const igThemes = ig.data?.themes || [];
  const liThemes = li.data?.themes || [];

  const canalPrincipal = ai.data?.canalPrincipal || [];
  const insights       = ai.data?.insights || [];

  return (
    <>
      {/* IG Temas */}
      <SectionHeader icon={Layers} title="Temas com Maior Relevância — Instagram" subtitle="Ranking por curtidas acumuladas" color={C.instagram} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px" }}>
        {igThemes.length > 0 ? (
          <>
            <ThemeRankCard themes={igThemes} platform="ig" />
            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {igThemes.slice(0, 3).map((t, i) => (
                <div key={i} style={{ background: C.bg, borderRadius: 10, padding: "14px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{t.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>{t.tema}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div><span style={{ fontSize: 9, color: C.textDim }}>Curtidas</span><div style={{ fontSize: 15, fontWeight: 700, color: C.instagram }}>{t.curtidas ?? "—"}</div></div>
                    <div><span style={{ fontSize: 9, color: C.textDim }}>Comentários</span><div style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>{t.comentarios ?? "—"}</div></div>
                    <div><span style={{ fontSize: 9, color: C.textDim }}>Compartilh.</span><div style={{ fontSize: 15, fontWeight: 700, color: C.green }}>{t.compartilhamentos ?? "—"}</div></div>
                    <div><span style={{ fontSize: 9, color: C.textDim }}>Alcance médio</span><div style={{ fontSize: 15, fontWeight: 700, color: C.purple }}>{t.alcanceMedio ?? "—"}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ color: C.textMuted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Nenhum tema cadastrado para Instagram.</p>
        )}
      </div>

      {/* LI Temas */}
      <SectionHeader icon={Layers} title="Temas com Maior Relevância — LinkedIn" subtitle="Ranking por engajamento acumulado" color={C.linkedin} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px" }}>
        {liThemes.length > 0 ? (
          <>
            <ThemeRankCard themes={liThemes} platform="li" />
            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {liThemes.slice(0, 3).map((t, i) => (
                <div key={i} style={{ background: C.bg, borderRadius: 10, padding: "14px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{t.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>{t.tema}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div><span style={{ fontSize: 9, color: C.textDim }}>Engajamento</span><div style={{ fontSize: 15, fontWeight: 700, color: C.linkedin }}>{fmt(t.engajamento)}</div></div>
                    <div><span style={{ fontSize: 9, color: C.textDim }}>Cliques</span><div style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>{fmt(t.cliques)}</div></div>
                    <div><span style={{ fontSize: 9, color: C.textDim }}>Alcance médio</span><div style={{ fontSize: 15, fontWeight: 700, color: C.green }}>{t.alcanceMedio ?? "—"}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ color: C.textMuted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Nenhum tema cadastrado para LinkedIn.</p>
        )}
      </div>

      {/* Canal Principal por Indicador */}
      <SectionHeader icon={Award} title="Canal Principal por Indicador" color={C.primary} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px" }}>
        {ai.loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ padding: "14px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <div style={{ height: 10, background: C.border, borderRadius: 3, width: "70%", marginBottom: 8 }} />
                <div style={{ height: 14, background: C.border, borderRadius: 3, width: "50%", marginBottom: 6 }} />
                <div style={{ height: 10, background: C.border, borderRadius: 3, width: "90%" }} />
              </div>
            ))}
          </div>
        ) : canalPrincipal.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
            {canalPrincipal.map((item, i) => (
              <div key={i} style={{ padding: "14px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.textDim, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.metric}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: platformColor(item.platform), marginBottom: 3 }}>{item.winner}</div>
                <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{item.value}</div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{item.note}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: C.textMuted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            {ai.error || "Sem dados para análise."}
          </p>
        )}
      </div>

      {/* Insights Estratégicos */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SectionHeader icon={Zap} title="Insights Estratégicos" subtitle="Gerados por IA com base nos dados do período" color={C.accent} />
        {!ai.loading && (
          <button
            onClick={ai.regenerate}
            disabled={ai.generating}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "transparent", border: `1px solid ${C.border}`,
              color: ai.generating ? C.textDim : C.textMuted,
              borderRadius: 8, padding: "6px 12px", fontSize: 11,
              cursor: ai.generating ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={12} style={{ animation: ai.generating ? "spin 1s linear infinite" : "none" }} />
            {ai.generating ? "Gerando..." : "Regenerar"}
          </button>
        )}
      </div>

      {ai.loading || ai.generating ? (
        <InsightSkeleton />
      ) : insights.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {insights.map((ins, i) => {
            const color = platformColor(ins.platform);
            return (
              <div key={i} style={{ background: C.card, border: `1px solid ${color}25`, borderRadius: 12, padding: "18px", borderLeft: `3px solid ${color}` }}>
                <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: C.text }}>{ins.title}</h4>
                <p style={{ margin: 0, fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>{ins.desc}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px", textAlign: "center" }}>
          <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>
            {ai.error ? `Erro: ${ai.error}` : "Sem dados suficientes para gerar insights."}
          </p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
