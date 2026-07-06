import React from "react";
import { Sparkles, RefreshCw, Trophy, ThumbsUp, ThumbsDown, Lightbulb, MessageSquare, Target } from "lucide-react";
import { useCampaignAiInsights } from "../../hooks/useCampaigns";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import SectionHeader from "../../components/ui/SectionHeader";
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

function List({ items, color }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 7 }}>
      {(items || []).map((item, i) => (
        <li key={i} style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.5 }}>
          <span style={{ color: color || C.text }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const CHANNEL_LABEL = { instagram: "Instagram", linkedin: "LinkedIn", website: "Website" };

export default function CampaignAiTab({ campaignId }) {
  const { data, loading, error, generating, regenerate } = useCampaignAiInsights(campaignId);

  if (loading) return <LoadingState message="Gerando análise por IA…" />;
  if (error)   return <ErrorState message={error} onRetry={regenerate} />;
  if (!data)   return null;

  const r = data.report || {};

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color={C.accent} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Insights gerados por IA</span>
          {data.generatedAt && (
            <span style={{ fontSize: 11, color: C.textDim }}>
              · {new Date(data.generatedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <button onClick={regenerate} disabled={generating} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: generating ? C.primary + "15" : "transparent", color: generating ? C.primaryLight : C.textMuted, cursor: generating ? "default" : "pointer", fontSize: 12, fontFamily: "inherit" }}>
          <RefreshCw size={12} style={{ animation: generating ? "spin 1s linear infinite" : "none" }} />
          {generating ? "Gerando…" : "Regenerar"}
        </button>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Resumo executivo */}
      <div style={{ background: `linear-gradient(135deg, ${C.primary}12, ${C.card})`, border: `1px solid ${C.primary}40`, borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.primaryLight, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Resumo Executivo</div>
        <p style={{ margin: 0, fontSize: 13.5, color: C.text, lineHeight: 1.65 }}>{r.resumoExecutivo || "—"}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 16 }}>
        {r.melhorCanal && (
          <Card title="Canal com Maior Desempenho" icon={Trophy} color={C.accent}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.accent, marginBottom: 6 }}>
              {CHANNEL_LABEL[r.melhorCanal.canal] || r.melhorCanal.canal}
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: C.textMuted, lineHeight: 1.5 }}>{r.melhorCanal.motivo}</p>
          </Card>
        )}
        {r.melhorPostagem && (
          <Card title="Postagem com Mais Engajamento" icon={Trophy} color={C.instagram}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.instagram, marginBottom: 5 }}>
              {CHANNEL_LABEL[r.melhorPostagem.canal] || r.melhorPostagem.canal}
            </div>
            <p style={{ margin: "0 0 6px", fontSize: 12.5, color: C.text, fontStyle: "italic" }}>"{r.melhorPostagem.descricao}"</p>
            <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{r.melhorPostagem.motivo}</p>
          </Card>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 16 }}>
        <Card title="O Que Funcionou Melhor" icon={ThumbsUp} color={C.green}>
          <List items={r.oQueFuncionou} />
        </Card>
        <Card title="Abaixo da Média" icon={ThumbsDown} color={C.red}>
          <List items={r.abaixoDaMedia} />
        </Card>
        <Card title="Pontos Fortes" icon={ThumbsUp} color={C.primary}>
          <List items={r.pontosFortes} />
        </Card>
        <Card title="Pontos de Melhoria" icon={Target} color={C.orange}>
          <List items={r.pontosDeMelhoria} />
        </Card>
      </div>

      <SectionHeader icon={Lightbulb} title="Recomendações" subtitle="Sugestões para as próximas campanhas" color={C.accent} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        <Card title="Sugestões p/ Próximas Campanhas" icon={Lightbulb} color={C.accent}>
          <List items={r.sugestoesProximasCampanhas} />
        </Card>
        <Card title="Temas Sugeridos" icon={Sparkles} color={C.purple}>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {(r.temasSugeridos || []).map((tema, i) => (
              <span key={i} style={{ fontSize: 11.5, fontWeight: 600, padding: "5px 12px", borderRadius: 20, background: C.purple + "20", color: C.purple }}>{tema}</span>
            ))}
          </div>
          {r.tomDeComunicacao && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <MessageSquare size={12} color={C.cyan} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>Tom de Comunicação</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: C.textMuted, lineHeight: 1.5 }}>{r.tomDeComunicacao}</p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
