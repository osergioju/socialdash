import React, { useState } from "react";
import { Plus, Megaphone, Trash2, Pencil, Calendar, ChevronRight, FolderOpen } from "lucide-react";
import { useClientContext } from "../../contexts/ClientContext";
import { useCampaigns } from "../../hooks/useCampaigns";
import { campaignsApi } from "../../services/api";
import CampaignFormModal from "../../components/campaigns/CampaignFormModal";
import CampaignDashboardView, { campaignStatus } from "../../components/campaigns/CampaignDashboardView";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import { C } from "../../utils/colors";

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";
}

// Tab "Campanhas": agrupador inteligente de conteúdos já existentes nas
// integrações. readOnly = cliente final (só visualização).
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
    if (!confirm("Excluir esta campanha? Os conteúdos originais não são afetados — apenas o agrupamento.")) return;
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
            {readOnly
              ? "Resultados consolidados dos conteúdos de cada campanha."
              : "Agrupe conteúdos já publicados (site, Instagram, LinkedIn) e veja o resultado consolidado."}
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
          {!readOnly && <p style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>Crie uma campanha e selecione os conteúdos que fazem parte dela.</p>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {campaigns.map((campaign) => {
          const status = campaignStatus(campaign);
          const totalAssets = (campaign._count?.posts ?? 0) + (campaign._count?.pages ?? 0);
          return (
            <div
              key={campaign.id}
              onClick={() => setSelectedId(campaign.id)}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", cursor: "pointer", transition: "border-color 0.15s", position: "relative" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = C.primary + "60"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: C.primary + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FolderOpen size={17} color={C.primaryLight} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{campaign.name}</div>
                  <div style={{ fontSize: 11, color: C.textDim, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Calendar size={10} /> {fmtDate(campaign.startDate)} → {fmtDate(campaign.endDate)}
                  </div>
                </div>
                <ChevronRight size={16} color={C.textDim} />
              </div>

              {campaign.description && (
                <p style={{ margin: "0 0 10px", fontSize: 12, color: C.textMuted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{campaign.description}</p>
              )}

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: status.color + "20", color: status.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {status.label}
                </span>
                <span style={{ fontSize: 10.5, color: totalAssets > 0 ? C.textMuted : C.orange, marginLeft: "auto" }}>
                  {totalAssets > 0
                    ? `${campaign._count?.posts ?? 0} publicações · ${campaign._count?.pages ?? 0} páginas`
                    : (readOnly ? "sem conteúdos" : "selecione os conteúdos →")}
                </span>
              </div>

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
          onSave={(saved) => {
            setModal(null);
            reload();
            // Campanha nova abre direto na seleção de conteúdos
            if (!modal.campaign && saved?.id) setSelectedId(saved.id);
          }}
        />
      )}
    </>
  );
}
