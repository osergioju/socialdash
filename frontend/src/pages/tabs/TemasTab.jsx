import React from "react";
import { Layers, TrendingUp } from "lucide-react";
import { useInstagram, useLinkedin } from "../../hooks/useMetrics";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import SectionHeader from "../../components/ui/SectionHeader";
import ThemeRankCard from "../../components/ui/ThemeRankCard";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

export default function TemasTab() {
  const ig = useInstagram();
  const li = useLinkedin();

  if (ig.loading || li.loading) return <LoadingState />;
  if (ig.error) return <ErrorState message={ig.error} />;
  if (li.error) return <ErrorState message={li.error} />;

  const igThemes = ig.data.themes;
  const liThemes = li.data.themes;

  return (
    <>
      <SectionHeader icon={Layers} title="Temas de Maior Desempenho" subtitle="Análise de conteúdo por engajamento" color={C.primary} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Instagram themes */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.instagram }} />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>Instagram — Top Temas</h3>
          </div>
          <ThemeRankCard themes={igThemes} platform="ig" />
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {["curtidas", "comentarios", "compartilhamentos"].map((k) => (
              <div key={k} style={{ background: C.cardHover, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.textMuted, textTransform: "capitalize", marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.instagram }}>{fmt(igThemes.reduce((s, t) => s + (t[k] ?? 0), 0))}</div>
              </div>
            ))}
          </div>
        </div>

        {/* LinkedIn themes */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.linkedin }} />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>LinkedIn — Top Temas</h3>
          </div>
          <ThemeRankCard themes={liThemes} platform="li" />
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {["engajamento", "cliques"].map((k) => (
              <div key={k} style={{ background: C.cardHover, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.textMuted, textTransform: "capitalize", marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.linkedin }}>{fmt(liThemes.reduce((s, t) => s + (t[k] ?? 0), 0))}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail table */}
      <div style={{ marginTop: 24, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22 }}>
        <SectionHeader icon={TrendingUp} title="Detalhamento Instagram" subtitle="Métricas de engajamento por tema" color={C.instagram} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>{["Tema", "Curtidas", "Comentários", "Compartilhamentos", "Alcance Médio"].map((h, i) => (
                <th key={i} style={{ padding: "10px 12px", textAlign: i === 0 ? "left" : "right", color: C.textMuted, fontSize: 10, fontWeight: 600, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {igThemes.map((t, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}22` }}>
                  <td style={{ padding: "10px 12px", color: C.text, fontWeight: 600 }}>{t.icon} {t.tema}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{t.curtidas}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{t.comentarios}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{t.compartilhamentos}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{t.alcanceMedio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
