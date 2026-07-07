import React, { useState } from "react";
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, ThumbsUp, ThumbsDown, Lightbulb, Target, Compass } from "lucide-react";
import { useListeningSummary } from "../../hooks/useListening";
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
  return (
    <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 7 }}>
      {(items || []).map((item, i) => (
        <li key={i} style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.5 }}>{item}</li>
      ))}
    </ul>
  );
}

export default function ListeningSummaryTab({ monitoringId, readOnly = false }) {
  const [period, setPeriod] = useState("weekly");
  const { data, loading, error, generating, regenerate } = useListeningSummary(monitoringId, period);

  const r = data?.report || {};

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ value: "weekly", label: "Resumo Semanal" }, { value: "monthly", label: "Resumo Mensal" }].map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)} style={{
              padding: "7px 16px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
              border: `1px solid ${period === p.value ? C.primary : C.border}`,
              background: period === p.value ? C.primary + "22" : "transparent",
              color: period === p.value ? C.primaryLight : C.textMuted,
            }}>
              {p.label}
            </button>
          ))}
        </div>
        {!readOnly && (
          <button onClick={regenerate} disabled={generating} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: generating ? C.primary + "15" : "transparent", color: generating ? C.primaryLight : C.textMuted, cursor: generating ? "default" : "pointer", fontSize: 12, fontFamily: "inherit" }}>
            <RefreshCw size={12} style={{ animation: generating ? "spin 1s linear infinite" : "none" }} />
            {generating ? "Gerando…" : "Regenerar"}
          </button>
        )}
      </div>

      {loading && <LoadingState message="Gerando resumo executivo por IA…" />}
      {error && <ErrorState message={error} onRetry={regenerate} />}

      {data && !loading && (
        <>
          {/* Percepção da marca */}
          <div style={{ background: `linear-gradient(135deg, ${C.cyan}12, ${C.card})`, border: `1px solid ${C.cyan}40`, borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Sparkles size={14} color={C.cyan} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.cyan, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Resumo {period === "weekly" ? "Semanal" : "Mensal"} · {data.periodKey}
              </span>
              {data.generatedAt && (
                <span style={{ fontSize: 10.5, color: C.textDim }}>
                  gerado em {new Date(data.generatedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 13.5, color: C.text, lineHeight: 1.65 }}>{r.resumo || "—"}</p>
            {r.percepcaoDaMarca && (
              <p style={{ margin: 0, fontSize: 12.5, color: C.textMuted, lineHeight: 1.6 }}>
                <b style={{ color: C.text }}>Percepção da marca:</b> {r.percepcaoDaMarca}
              </p>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 16 }}>
            <Card title="Principais Assuntos" icon={Compass} color={C.cyan}>
              <List items={r.principaisAssuntos} />
            </Card>
            <Card title="Temas Emergentes" icon={TrendingUp} color={C.purple}>
              <List items={r.temasEmergentes} />
            </Card>
            <Card title="Elogios Recorrentes" icon={ThumbsUp} color={C.green}>
              <List items={r.elogiosRecorrentes} />
            </Card>
            <Card title="Críticas Recorrentes" icon={ThumbsDown} color={C.red}>
              <List items={r.criticasRecorrentes} />
            </Card>
            <Card title="Oportunidades" icon={Lightbulb} color={C.accent}>
              <List items={r.oportunidades} />
            </Card>
            <Card title="Riscos" icon={AlertTriangle} color={C.orange}>
              <List items={r.riscos} />
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
            <Card title="Recomendações" icon={Target} color={C.primary}>
              <List items={r.recomendacoes} />
            </Card>
            <Card title="Tendências" icon={TrendingUp} color={C.cyan}>
              <List items={r.tendencias} />
            </Card>
          </div>
        </>
      )}
    </>
  );
}
