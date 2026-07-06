import React, { useState } from "react";
import { Search, ExternalLink, ChevronLeft, ChevronRight, MessageSquare, AlertTriangle } from "lucide-react";
import { useMentions } from "../../hooks/useListening";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import { C } from "../../utils/colors";

const SENTIMENTS = [
  { value: "",         label: "Todos" },
  { value: "POSITIVE", label: "Positivas" },
  { value: "NEGATIVE", label: "Negativas" },
  { value: "NEUTRAL",  label: "Neutras" },
];

const SOURCES = [
  { value: "",            label: "Todas as fontes" },
  { value: "GOOGLE_NEWS", label: "Google News" },
  { value: "REDDIT",      label: "Reddit" },
  { value: "YOUTUBE",     label: "YouTube" },
  { value: "RSS",         label: "RSS / Blogs" },
];

const SENTIMENT_META = {
  POSITIVE: { label: "Positiva", color: C.green },
  NEGATIVE: { label: "Negativa", color: C.red },
  NEUTRAL:  { label: "Neutra",   color: C.textDim },
};

const selectStyle = {
  padding: "8px 12px", borderRadius: 9, border: `1px solid ${C.border}`,
  background: C.cardHover, color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer",
};

function MentionCard({ mention }) {
  const [expanded, setExpanded] = useState(false);
  const s = mention.sentiment;
  const meta = SENTIMENT_META[s?.sentiment] || { label: "Sem análise", color: C.textDim };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ display: "flex", gap: 12 }}>
        {mention.imageUrl && (
          <img src={mention.imageUrl} alt="" style={{ width: 68, height: 68, borderRadius: 9, objectFit: "cover", background: C.cardHover, flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: meta.color + "20", color: meta.color, textTransform: "uppercase" }}>
              {meta.label}{s?.score != null ? ` ${s.score > 0 ? "+" : ""}${s.score}` : ""}
            </span>
            <span style={{ fontSize: 10, color: C.textDim }}>
              {mention.sourceType}{mention.sourceName ? ` · ${mention.sourceName}` : ""}
              {mention.author ? ` · ${mention.author}` : ""}
              {mention.publishedAt ? ` · ${new Date(mention.publishedAt).toLocaleDateString("pt-BR")}` : ""}
            </span>
            {s?.urgency === "alta" && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: C.red + "20", color: C.red, display: "flex", alignItems: "center", gap: 3 }}>
                <AlertTriangle size={9} /> URGENTE
              </span>
            )}
            {s?.category && (
              <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 20, background: C.purple + "18", color: C.purple }}>{s.category}</span>
            )}
          </div>

          <a href={mention.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>
              {mention.title || mention.url}
              <ExternalLink size={11} color={C.textDim} />
            </div>
          </a>

          {(mention.summary || mention.text) && (
            <p style={{ margin: "5px 0 0", fontSize: 12, color: C.textMuted, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: expanded ? "unset" : 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {mention.summary || mention.text}
            </p>
          )}

          {expanded && s && (
            <div style={{ marginTop: 10, padding: "10px 14px", background: C.cardHover, borderRadius: 9, fontSize: 11.5, color: C.textMuted, display: "flex", flexDirection: "column", gap: 4 }}>
              {s.theme  && <div><b style={{ color: C.text }}>Tema:</b> {s.theme}</div>}
              {s.intent && <div><b style={{ color: C.text }}>Intenção:</b> {s.intent}</div>}
              {s.urgency && <div><b style={{ color: C.text }}>Urgência:</b> {s.urgency}</div>}
              {Array.isArray(s.entities) && s.entities.length > 0 && (
                <div><b style={{ color: C.text }}>Entidades:</b> {s.entities.join(", ")}</div>
              )}
              {s.suggestedReply && (
                <div style={{ marginTop: 4, padding: "8px 12px", background: C.primary + "12", borderRadius: 8, borderLeft: `3px solid ${C.primary}` }}>
                  <b style={{ color: C.primaryLight }}>Sugestão de resposta:</b>
                  <p style={{ margin: "3px 0 0", color: C.text }}>{s.suggestedReply}</p>
                </div>
              )}
            </div>
          )}

          {s && (
            <button onClick={() => setExpanded(!expanded)} style={{ marginTop: 7, padding: 0, border: "none", background: "transparent", color: C.primaryLight, cursor: "pointer", fontSize: 11, fontFamily: "inherit", fontWeight: 600 }}>
              {expanded ? "▲ Menos detalhes" : "▼ Análise completa"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListeningMentionsTab({ monitoringId }) {
  const [sentiment, setSentiment]   = useState("");
  const [sourceType, setSourceType] = useState("");
  const [q, setQ]                   = useState("");
  const [qInput, setQInput]         = useState("");
  const [page, setPage]             = useState(1);

  const { data, loading, error, reload } = useMentions(monitoringId, {
    sentiment: sentiment || undefined,
    sourceType: sourceType || undefined,
    q: q || undefined,
    page,
    pageSize: 20,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  function submitSearch(e) {
    e.preventDefault();
    setPage(1);
    setQ(qInput);
  }

  return (
    <>
      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <form onSubmit={submitSearch} style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={14} color={C.textDim} style={{ position: "absolute", left: 11, top: 10 }} />
          <input
            style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.cardHover, color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            placeholder="Pesquisar menções… (Enter)"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
        </form>
        <select style={selectStyle} value={sentiment} onChange={(e) => { setPage(1); setSentiment(e.target.value); }}>
          {SENTIMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select style={selectStyle} value={sourceType} onChange={(e) => { setPage(1); setSourceType(e.target.value); }}>
          {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading && <LoadingState message="Carregando menções…" />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && !loading && (
        <>
          <p style={{ fontSize: 12, color: C.textDim, margin: "0 0 12px" }}>{data.total} menção(ões) encontrada(s)</p>

          {data.mentions.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <MessageSquare size={44} color={C.textDim} style={{ marginBottom: 12 }} />
              <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>Nenhuma menção com esses filtros.</p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.mentions.map((m) => <MentionCard key={m.id} mention={m} />)}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 22 }}>
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: page <= 1 ? C.textDim : C.text, cursor: page <= 1 ? "default" : "pointer", fontSize: 12, fontFamily: "inherit" }}>
                <ChevronLeft size={13} /> Anterior
              </button>
              <span style={{ fontSize: 12, color: C.textMuted }}>Página {page} de {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: page >= totalPages ? C.textDim : C.text, cursor: page >= totalPages ? "default" : "pointer", fontSize: 12, fontFamily: "inherit" }}>
                Próxima <ChevronRight size={13} />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
