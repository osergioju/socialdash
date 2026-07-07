import React, { useState } from "react";
import { Plus, Megaphone, Trash2, Pencil, Calendar, User, ChevronRight } from "lucide-react";
import { useClientContext } from "../../contexts/ClientContext";
import { useCampaigns } from "../../hooks/useCampaigns";
import { campaignsApi } from "../../services/api";
import CampaignFormModal from "../../components/campaigns/CampaignFormModal";
import CampaignDashboardView from "../../components/campaigns/CampaignDashboardView";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import { C } from "../../utils/colors";

const STATUS_META = {
  PLANNING: { label: "Planejamento", color: C.accent },
  ACTIVE:   { label: "Ativa",        color: C.green },
  ENDED:    { label: "Encerrada",    color: C.textDim },
};

const CHANNEL_LABEL = { INSTAGRAM: "Instagram", LINKEDIN: "LinkedIn", WEBSITE: "Website" };

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";
}

// Tab "Campanhas" dos dashboards (agência e cliente final).
// readOnly = cliente final: só visualização (sem criar/editar/excluir).
export default function CampanhasTab({ readOnly = false }) {
  const clientId = useClientContext();
  const { campaigns, loading, error, reload } = useCampaigns(clientId);
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  if (selectedId) {
    return (
      <CampaignDashboardView
        campaignId={selectedId}
        readOnly={readOnly}
        onBack={() => { setSelectedId(null); reload(); }}
      />
    );
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm("Excluir esta campanha e todas as associações?")) return;
    setDeleting(id);
    await campaignsApi.remove(id).catch(() => null);
    reload();
    setDeleting(null);
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>Campanhas</h2>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: C.textMuted }}>
            {readOnly ? "Resultados das ações de marketing por campanha." : "Organize as ações de marketing e acompanhe resultados por canal."}
          </p>
        </div>
        {!readOnly && (
          <button onClick={() => setModal({})} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
            <Plus size={15} /> Nova Campanha
          </button>
        )}
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && campaigns.length === 0 && (
        <div style={{ textAlign: "center", padding: "50px 20px" }}>
          <Megaphone size={44} color={C.textDim} style={{ marginBottom: 12 }} />
          <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>Nenhuma campanha ainda.</p>
          {!readOnly && <p style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>Clique em "Nova Campanha" para começar.</p>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {campaigns.map((campaign) => {
          const status = STATUS_META[campaign.status] || STATUS_META.PLANNING;
          const color = campaign.color || C.primary;
          return (
            <div
              key={campaign.id}
              onClick={() => setSelectedId(campaign.id)}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", cursor: "pointer", transition: "border-color 0.15s", position: "relative", borderLeft: `4px solid ${color}` }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = color + "80"}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.borderLeftColor = color; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                {campaign.imageUrl ? (
                  <img src={campaign.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", background: C.border }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "25", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Megaphone size={17} color={color} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{campaign.name}</div>
                  <div style={{ fontSize: 11, color: C.textDim, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Calendar size={10} /> {fmtDate(campaign.startDate)} → {fmtDate(campaign.endDate)}
                  </div>
                </div>
                <ChevronRight size={16} color={C.textDim} />
              </div>

              {campaign.objective && (
                <p style={{ margin: "0 0 10px", fontSize: 12, color: C.textMuted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{campaign.objective}</p>
              )}

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: status.color + "20", color: status.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {status.label}
                </span>
                {(campaign.channels || []).map((ch) => (
                  <span key={ch.channel} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: C.cardHover, color: C.textMuted, border: `1px solid ${C.border}` }}>
                    {CHANNEL_LABEL[ch.channel] || ch.channel}
                  </span>
                ))}
                <span style={{ fontSize: 10, color: C.textDim, marginLeft: "auto" }}>
                  {campaign._count?.posts ?? 0} conteúdos · {campaign._count?.pages ?? 0} páginas
                </span>
              </div>

              {campaign.responsible && (
                <div style={{ fontSize: 11, color: C.textDim, display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                  <User size={10} /> {campaign.responsible}
                </div>
              )}

              {!readOnly && (
                <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setModal({ campaign }); }}
                    style={{ padding: 6, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textDim, display: "flex", opacity: 0.6 }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = C.primaryLight; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.color = C.textDim; }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, campaign.id)}
                    disabled={deleting === campaign.id}
                    style={{ padding: 6, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textDim, display: "flex", opacity: 0.6 }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#EF4444"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.color = C.textDim; }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && !readOnly && (
        <CampaignFormModal
          clientId={clientId}
          campaign={modal.campaign}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); reload(); }}
        />
      )}
    </>
  );
}
