import React from "react";
import { Layers, Award, Zap } from "lucide-react";
import { useInstagram, useLinkedin } from "../../hooks/useMetrics";
import { useClientContext } from "../../contexts/ClientContext";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import SectionHeader from "../../components/ui/SectionHeader";
import ThemeRankCard from "../../components/ui/ThemeRankCard";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

const CANAL_PRINCIPAL = [
  { metric: "Crescimento Seguidores", winner: "LinkedIn",        value: "Base maior, constante", color: C.linkedin,  note: "Crescimento orgânico estável" },
  { metric: "Engajamento / Post",     winner: "Instagram",       value: "Reels ~10% ER",         color: C.instagram, note: "Reels são motor de engajamento" },
  { metric: "Alcance Orgânico",       winner: "Instagram",       value: "Pico com Reels",        color: C.instagram, note: "Conteúdo em vídeo dobra alcance" },
  { metric: "Cliques / Ações",        winner: "LinkedIn",        value: "Eventos geram ação",    color: C.linkedin,  note: "Eventos geram mais cliques" },
  { metric: "Tráfego pro Site",       winner: "Google Orgânico", value: "~55% do tráfego",       color: C.ga4,       note: "SEO é o maior canal de aquisição" },
  { metric: "Autoridade",             winner: "LinkedIn",        value: "Governança + Dados",    color: C.linkedin,  note: "Posts de congressos e conselhos" },
];

const INSIGHTS = [
  { title: "🎬 Reels é o motor",          desc: "Conteúdo em vídeo curto maximiza alcance e interações. Priorize Reels com temas comportamentais e dados.",                          color: C.instagram },
  { title: "⚠️ LinkedIn: reposicionar",   desc: "Queda de engajamento demanda editorial exclusivo: voz institucional, macrocenário e dados com profundidade.",                     color: C.linkedin  },
  { title: "📊 'Dados que Falam'",        desc: "Conteúdo baseado em dados funciona em ambos canais. No IG gera curtidas, no LI gera cliques. Manter como pilar fixo.",           color: C.primary   },
  { title: "🌐 Site: revisar UX",         desc: "Taxa de engajamento em queda. Páginas-chave precisam de CTAs mais claros e fluxo de conversão otimizado.",                       color: C.ga4       },
  { title: "📱 Stories = oportunidade",   desc: "Quando há ritmo e consistência, a audiência acompanha. Canal ideal para educação financeira e interação.",                        color: C.accent    },
  { title: "🎯 Meta: +50% engajamento",  desc: "Dobrar Reels (min 8/mês), editorial exclusivo LI, 'Dados que Falam' quinzenal, integração redes → site.",                        color: C.green     },
];

export default function TemasTab() {
  const clientId = useClientContext();
  const ig = useInstagram(clientId);
  const li = useLinkedin(clientId);

  if (ig.loading || li.loading) return <LoadingState />;
  if (ig.error) return <ErrorState message={ig.error} />;
  if (li.error) return <ErrorState message={li.error} />;

  const igThemes = ig.data?.themes || [];
  const liThemes = li.data?.themes || [];

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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
          {CANAL_PRINCIPAL.map((item, i) => (
            <div key={i} style={{ padding: "14px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.textDim, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.metric}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: item.color, marginBottom: 3 }}>{item.winner}</div>
              <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{item.value}</div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{item.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights Estratégicos */}
      <SectionHeader icon={Zap} title="Insights Estratégicos" subtitle="Baseados na análise do período" color={C.accent} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {INSIGHTS.map((ins, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${ins.color}25`, borderRadius: 12, padding: "18px", borderLeft: `3px solid ${ins.color}` }}>
            <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: C.text }}>{ins.title}</h4>
            <p style={{ margin: 0, fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>{ins.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}
