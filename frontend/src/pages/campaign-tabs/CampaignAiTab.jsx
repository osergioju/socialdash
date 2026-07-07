import React from "react";
import { Sparkles, RefreshCw, Trophy, Globe, TrendingUp, Lightbulb, GraduationCap, LayoutGrid, Tags, Link2 } from "lucide-react";
import { useCampaignAiInsights } from "../../hooks/useCampaigns";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import { C } from "../../utils/colors";

function Card({ title, icon: Icon, color, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ background: color + "20", borderRadius: 8, padding: 6, display: "flex" }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function List({ items }) {
  if (!Array.isArray(items) || items.length === 0) return <p style={{ margin: 0, fontSize: 12, color: C.textDim }}>—</p>;
  return (
    <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 7 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.5 }}>{item}</li>
      ))}
    </ul>
  );
}

function Text({ children }) {
  if (!children) return <p style={{ margin: 0, fontSize: 12, color: C.textDim }}>—</p>;
  return <p style={{ margin: 0, fontSize: 12.5, color: C.textMuted, lineHeight: 1.6 }}>{children}</p>;
}

const CHANNEL_LABEL = { instagram: "Instagram", linkedin: "LinkedIn", website: "Website" };

// Insights IA da campanha — analisa SOMENTE os conteúdos vinculados.
export default function CampaignAiTab({ campaignId, readOnly = false }) {
  const { data, loading, error, generating, regenerate } = useCampaignAiInsights(campaignId);

  if (loading) return <LoadingState message="Analisando os conteúdos da campanha por IA…" />;
  if (error)   return <ErrorState message={error} onRetry={readOnly ? undefined : regenerate} />;
  if (!data)   return null;

  const r = data.report || {};

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color={C.accent} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Análise dos conteúdos vinculados</span>
          {data.generatedAt && (
            <span style={{ fontSize: 11, color: C.textDim }}>
              · {new Date(data.generatedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        {!readOnly && (
          <button onClick={regenerate} disabled={generating} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: generating ? C.primary + "15" : "transparent", color: generating ? C.primaryLight : C.textMuted, cursor: generating ? "default" : "pointer", fontSize: 12, fontFamily: "inherit" }}>
            <RefreshCw size={12} style={{ animation: generating ? "spin 1s linear infinite" : "none" }} />
            {generating ? "Gerando…" : "Regenerar"}
          </button>
        )}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Resumo executivo */}
      <div style={{ background: `linear-gradient(135deg, ${C.primary}12, ${C.card})`, border: `1px solid ${C.primary}40`, borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.primaryLight, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Resumo Executivo</div>
        <p style={{ margin: 0, fontSize: 13.5, color: C.text, lineHeight: 1.65 }}>{r.resumoExecutivo || "—"}</p>
      </div>

      {/* Perguntas-chave da campanha */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 16 }}>
        {r.melhorPublicacao && (
          <Card title="Melhor Publicação" icon={Trophy} color={C.accent}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 5 }}>
              {CHANNEL_LABEL[r.melhorPublicacao.canal] || r.melhorPublicacao.canal}
            </div>
            <p style={{ margin: "0 0 6px", fontSize: 12.5, color: C.text, fontStyle: "italic" }}>"{r.melhorPublicacao.descricao}"</p>
            <Text>{r.melhorPublicacao.motivo}</Text>
          </Card>
        )}
        {r.canalMaiorEngajamento && (
          <Card title="Canal com Mais Engajamento" icon={Trophy} color={C.instagram}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.instagram, marginBottom: 6 }}>
              {CHANNEL_LABEL[r.canalMaiorEngajamento.canal] || r.canalMaiorEngajamento.canal}
            </div>
            <Text>{r.canalMaiorEngajamento.motivo}</Text>
          </Card>
        )}
        {r.paginaMaisVisitada && (
          <Card title="Página Mais Visitada" icon={Globe} color={C.ga4}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ga4, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
              {r.paginaMaisVisitada.pagina}
            </div>
            <Text>{r.paginaMaisVisitada.analise}</Text>
          </Card>
        )}
        {r.trafegoParaOSite && (
          <Card title="Tráfego para o Site" icon={Link2} color={C.cyan}>
            <Text>{r.trafegoParaOSite}</Text>
          </Card>
        )}
        {r.crescimentoNoPeriodo && (
          <Card title="Crescimento no Período" icon={TrendingUp} color={C.green}>
            <Text>{r.crescimentoNoPeriodo}</Text>
          </Card>
        )}
        {r.formatosQuePerformaram && (
          <Card title="Formatos que Performaram" icon={LayoutGrid} color={C.purple}>
            <List items={r.formatosQuePerformaram} />
          </Card>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        <Card title="Temas com Melhor Aceitação" icon={Tags} color={C.cyan}>
          {Array.isArray(r.temasComMelhorAceitacao) && r.temasComMelhorAceitacao.length > 0 ? (
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {r.temasComMelhorAceitacao.map((tema, i) => (
                <span key={i} style={{ fontSize: 11.5, fontWeight: 600, padding: "5px 12px", borderRadius: 20, background: C.cyan + "18", color: C.cyan }}>{tema}</span>
              ))}
            </div>
          ) : <Text />}
        </Card>
        <Card title="Aprendizados" icon={GraduationCap} color={C.green}>
          <List items={r.aprendizados} />
        </Card>
        <Card title="Sugestões p/ Próxima Campanha" icon={Lightbulb} color={C.accent}>
          <List items={r.sugestoesProximaCampanha} />
        </Card>
      </div>
    </>
  );
}
