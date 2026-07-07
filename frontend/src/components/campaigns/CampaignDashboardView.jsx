import React, { useState } from "react";
import { ArrowLeft, BarChart3, Globe, Megaphone, Sparkles, LayoutList, Pencil } from "lucide-react";
import CampaignFormModal from "./CampaignFormModal";
import { useCampaign, useCampaignDashboard } from "../../hooks/useCampaigns";
import { LoadingState, ErrorState } from "../ui/LoadingState";
import { C } from "../../utils/colors";
import CampaignOverviewTab  from "../../pages/campaign-tabs/CampaignOverviewTab";
import CampaignWebsiteTab   from "../../pages/campaign-tabs/CampaignWebsiteTab";
import CampaignInstagramTab from "../../pages/campaign-tabs/CampaignInstagramTab";
import CampaignLinkedinTab  from "../../pages/campaign-tabs/CampaignLinkedinTab";
import CampaignContentTab   from "../../pages/campaign-tabs/CampaignContentTab";
import CampaignAiTab        from "../../pages/campaign-tabs/CampaignAiTab";

const InstagramIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" />
  </svg>
);
const LinkedinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
  </svg>
);

const STATUS_META = {
  PLANNING: { label: "Planejamento", color: C.accent },
  ACTIVE:   { label: "Ativa",        color: C.green },
  ENDED:    { label: "Encerrada",    color: C.textDim },
};

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
}

// Visão completa de uma campanha (sub-tabs), embutida na tab "Campanhas" dos
// dashboards. readOnly = cliente final: sem editar nem gerenciar conteúdos.
export default function CampaignDashboardView({ campaignId, readOnly = false, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showEdit, setShowEdit] = useState(false);
  const { campaign, reload: reloadCampaign } = useCampaign(campaignId);
  const { data, loading, error, reload } = useCampaignDashboard(campaignId);

  const channels = new Set(campaign?.channels?.map((c) => c.channel) || []);

  const TABS = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    ...(channels.has("WEBSITE")   ? [{ id: "website",   label: "Website",   icon: Globe }] : []),
    ...(channels.has("INSTAGRAM") ? [{ id: "instagram", label: "Instagram", icon: InstagramIcon }] : []),
    ...(channels.has("LINKEDIN")  ? [{ id: "linkedin",  label: "LinkedIn",  icon: LinkedinIcon }] : []),
    ...(!readOnly ? [{ id: "content", label: "Conteúdos", icon: LayoutList }] : []),
    { id: "ai", label: "Insights IA", icon: Sparkles },
  ];

  const status = STATUS_META[campaign?.status] || STATUS_META.PLANNING;
  const color = campaign?.color || C.primary;

  function renderTab() {
    if (activeTab === "content" && !readOnly) {
      return <CampaignContentTab campaign={campaign} onChanged={() => { reloadCampaign(); reload(); }} />;
    }
    if (activeTab === "ai") return <CampaignAiTab campaignId={campaignId} readOnly={readOnly} />;
    if (loading) return <LoadingState message="Carregando dashboard da campanha…" />;
    if (error)   return <ErrorState message={error} onRetry={reload} />;
    if (!data)   return null;
    switch (activeTab) {
      case "website":   return <CampaignWebsiteTab data={data} />;
      case "instagram": return <CampaignInstagramTab data={data} />;
      case "linkedin":  return <CampaignLinkedinTab data={data} />;
      default:          return <CampaignOverviewTab data={data} onGoToContent={readOnly ? undefined : () => setActiveTab("content")} />;
    }
  }

  return (
    <div>
      {/* Cabeçalho da campanha */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, fontSize: 12, fontFamily: "inherit" }}
        >
          <ArrowLeft size={13} /> Campanhas
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "25", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Megaphone size={20} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: C.text }}>
              {campaign?.name || "Campanha"}
            </h2>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: status.color + "20", color: status.color, textTransform: "uppercase" }}>
              {status.label}
            </span>
            {!readOnly && campaign && (
              <button onClick={() => setShowEdit(true)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, fontSize: 11, fontFamily: "inherit" }}>
                <Pencil size={11} /> Editar
              </button>
            )}
          </div>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: C.textMuted }}>
            {fmtDate(campaign?.startDate)} → {fmtDate(campaign?.endDate)}
            {campaign?.objective ? ` · ${campaign.objective}` : ""}
            {campaign?.responsible ? ` · Resp.: ${campaign.responsible}` : ""}
          </p>
        </div>
      </div>

      {/* Sub-tabs da campanha */}
      <div style={{ display: "flex", gap: 3, overflowX: "auto", borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const isA = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: "9px 9px 0 0", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap", background: isA ? C.card : "transparent", color: isA ? C.primaryLight : C.textMuted, boxShadow: isA ? `inset 0 2px 0 ${color}` : "none" }}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </div>

      {renderTab()}

      {showEdit && campaign && !readOnly && (
        <CampaignFormModal
          clientId={campaign.clientId}
          campaign={campaign}
          onClose={() => setShowEdit(false)}
          onSave={() => { setShowEdit(false); reloadCampaign(); reload(); }}
        />
      )}
    </div>
  );
}
