import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Globe, Megaphone, Sparkles, LayoutList, Pencil } from "lucide-react";
import AgencyLayout from "../layouts/AgencyLayout";
import CampaignFormModal from "../components/campaigns/CampaignFormModal";
import { useCampaign, useCampaignDashboard } from "../hooks/useCampaigns";
import { LoadingState, ErrorState } from "../components/ui/LoadingState";
import { C } from "../utils/colors";
import CampaignOverviewTab  from "./campaign-tabs/CampaignOverviewTab";
import CampaignWebsiteTab   from "./campaign-tabs/CampaignWebsiteTab";
import CampaignInstagramTab from "./campaign-tabs/CampaignInstagramTab";
import CampaignLinkedinTab  from "./campaign-tabs/CampaignLinkedinTab";
import CampaignContentTab   from "./campaign-tabs/CampaignContentTab";
import CampaignAiTab        from "./campaign-tabs/CampaignAiTab";

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

export default function CampaignDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showEdit, setShowEdit] = useState(false);
  const { campaign, reload: reloadCampaign } = useCampaign(id);
  const { data, loading, error, reload } = useCampaignDashboard(id);

  const channels = new Set(campaign?.channels?.map((c) => c.channel) || []);

  const TABS = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    ...(channels.has("WEBSITE")   ? [{ id: "website",   label: "Website",   icon: Globe }] : []),
    ...(channels.has("INSTAGRAM") ? [{ id: "instagram", label: "Instagram", icon: InstagramIcon }] : []),
    ...(channels.has("LINKEDIN")  ? [{ id: "linkedin",  label: "LinkedIn",  icon: LinkedinIcon }] : []),
    { id: "content", label: "Conteúdos",   icon: LayoutList },
    { id: "ai",      label: "Insights IA", icon: Sparkles },
  ];

  const status = STATUS_META[campaign?.status] || STATUS_META.PLANNING;
  const color = campaign?.color || C.primary;

  function renderTab() {
    if (activeTab === "content") {
      return <CampaignContentTab campaign={campaign} onChanged={() => { reloadCampaign(); reload(); }} />;
    }
    if (activeTab === "ai") return <CampaignAiTab campaignId={id} />;
    if (loading) return <LoadingState message="Carregando dashboard da campanha…" />;
    if (error)   return <ErrorState message={error} onRetry={reload} />;
    if (!data)   return null;
    switch (activeTab) {
      case "website":   return <CampaignWebsiteTab data={data} />;
      case "instagram": return <CampaignInstagramTab data={data} />;
      case "linkedin":  return <CampaignLinkedinTab data={data} />;
      default:          return <CampaignOverviewTab data={data} onGoToContent={() => setActiveTab("content")} />;
    }
  }

  return (
    <AgencyLayout>
      <div style={{ padding: "0 0 60px" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${color}18 0%, ${C.bg} 60%)`, borderBottom: `1px solid ${C.border}`, padding: "18px 28px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button
              onClick={() => navigate("/campaigns")}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, fontSize: 12, fontFamily: "inherit" }}
            >
              <ArrowLeft size={13} /> Campanhas
            </button>
            <span style={{ color: C.textDim, fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.textMuted }}>{campaign?.client?.name || "…"}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "25", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Megaphone size={20} color={color} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: C.text }}>
                  {campaign?.name || "Campanha"}
                </h1>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: status.color + "20", color: status.color, textTransform: "uppercase" }}>
                  {status.label}
                </span>
                <button onClick={() => setShowEdit(true)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, fontSize: 11, fontFamily: "inherit" }}>
                  <Pencil size={11} /> Editar
                </button>
              </div>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: C.textMuted }}>
                {fmtDate(campaign?.startDate)} → {fmtDate(campaign?.endDate)}
                {campaign?.objective ? ` · ${campaign.objective}` : ""}
                {campaign?.responsible ? ` · Resp.: ${campaign.responsible}` : ""}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 3, overflowX: "auto" }}>
            {TABS.map((t) => {
              const Icon = t.icon;
              const isA = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: "9px 9px 0 0", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap", background: isA ? C.bg : "transparent", color: isA ? C.primaryLight : C.textMuted, boxShadow: isA ? `inset 0 2px 0 ${color}` : "none" }}>
                  <Icon size={14} />{t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "22px 24px" }}>
          {renderTab()}
        </div>
      </div>

      {showEdit && campaign && (
        <CampaignFormModal
          clientId={campaign.clientId}
          campaign={campaign}
          onClose={() => setShowEdit(false)}
          onSave={() => { setShowEdit(false); reloadCampaign(); reload(); }}
        />
      )}
    </AgencyLayout>
  );
}
