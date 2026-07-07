import React, { useState } from "react";
import { Plus, Radar, Trash2, Pencil, ChevronRight, Hash, Swords } from "lucide-react";
import { useClientContext } from "../../contexts/ClientContext";
import { useMonitorings } from "../../hooks/useListening";
import { listeningApi } from "../../services/api";
import MonitoringFormModal from "../../components/listening/MonitoringFormModal";
import ListeningDashboardView from "../../components/listening/ListeningDashboardView";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import { C } from "../../utils/colors";

function fmtRelative(date) {
  if (!date) return "nunca";
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

// Tab "Social Listening" dos dashboards (agência e cliente final).
// readOnly = cliente final: só visualização.
export default function ListeningTab({ readOnly = false }) {
  const clientId = useClientContext();
  const { monitorings, loading, error, reload } = useMonitorings(clientId);
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  if (selectedId) {
    return (
      <ListeningDashboardView
        monitoringId={selectedId}
        readOnly={readOnly}
        onBack={() => { setSelectedId(null); reload(); }}
      />
    );
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm("Excluir este monitoramento e todas as menções coletadas?")) return;
    setDeleting(id);
    await listeningApi.remove(id).catch(() => null);
    reload();
    setDeleting(null);
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>Social Listening</h2>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: C.textMuted }}>
            {readOnly ? "Menções da marca, concorrentes e palavras-chave na web." : "Monitore menções da marca, concorrentes e palavras-chave na web."}
          </p>
        </div>
        {!readOnly && (
          <button onClick={() => setModal({})} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
            <Plus size={15} /> Novo Monitoramento
          </button>
        )}
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && monitorings.length === 0 && (
        <div style={{ textAlign: "center", padding: "50px 20px" }}>
          <Radar size={44} color={C.textDim} style={{ marginBottom: 12 }} />
          <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>Nenhum monitoramento ainda.</p>
          {!readOnly && <p style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>Crie um monitoramento para começar a ouvir a web.</p>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {monitorings.map((m) => (
          <div
            key={m.id}
            onClick={() => setSelectedId(m.id)}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", cursor: "pointer", position: "relative", transition: "border-color 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = C.cyan + "60"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: C.cyan + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Radar size={17} color={C.cyan} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Marca: {m.brand}</div>
              </div>
              <ChevronRight size={16} color={C.textDim} />
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: (m.status === "ACTIVE" ? C.green : C.textDim) + "20", color: m.status === "ACTIVE" ? C.green : C.textDim, textTransform: "uppercase" }}>
                {m.status === "ACTIVE" ? "Ativo" : "Pausado"}
              </span>
              {(m.keywords || []).slice(0, 3).map((kw) => (
                <span key={kw} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: C.cardHover, color: C.textMuted, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 3 }}>
                  <Hash size={9} />{kw}
                </span>
              ))}
              {(m.competitors || []).length > 0 && (
                <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: C.orange + "15", color: C.orange, display: "flex", alignItems: "center", gap: 3 }}>
                  <Swords size={9} />{m.competitors.length} concorrente(s)
                </span>
              )}
            </div>

            <div style={{ fontSize: 11, color: C.textDim }}>
              {m._count?.mentions ?? 0} menções · coleta {fmtRelative(m.lastCollectedAt)}
            </div>

            {!readOnly && (
              <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setModal({ monitoring: m }); }}
                  style={{ padding: 6, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textDim, display: "flex", opacity: 0.6 }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = C.primaryLight; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.color = C.textDim; }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={(e) => handleDelete(e, m.id)}
                  disabled={deleting === m.id}
                  style={{ padding: 6, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textDim, display: "flex", opacity: 0.6 }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#EF4444"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.color = C.textDim; }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && !readOnly && (
        <MonitoringFormModal
          clientId={clientId}
          monitoring={modal.monitoring}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); reload(); }}
        />
      )}
    </>
  );
}
