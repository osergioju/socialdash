import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { BarChart3, Globe, Layers, LogOut, Megaphone, Radar } from "lucide-react";
import { C } from "../utils/colors";
import { useClientAuth } from "../contexts/ClientAuthContext";
import { ClientContext } from "../contexts/ClientContext";
import OverviewTab  from "./tabs/OverviewTab";
import InstagramTab from "./tabs/InstagramTab";
import LinkedinTab  from "./tabs/LinkedinTab";
import Ga4Tab       from "./tabs/Ga4Tab";
import TemasTab     from "./tabs/TemasTab";
import CampanhasTab from "./tabs/CampanhasTab";
import ListeningTab from "./tabs/ListeningTab";

const InstagramIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" />
  </svg>
);
const LinkedinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
  </svg>
);

const TABS = [
  { id: "overview",  label: "Visão Geral",      icon: BarChart3 },
  { id: "instagram", label: "Instagram",         icon: InstagramIcon },
  { id: "linkedin",  label: "LinkedIn",          icon: LinkedinIcon },
  { id: "site",      label: "Site (GA4)",        icon: Globe },
  { id: "temas",     label: "Temas & Conteúdo",  icon: Layers },
  { id: "campanhas", label: "Campanhas",         icon: Megaphone },
  { id: "listening", label: "Social Listening",  icon: Radar },
];

const TAB_COMPONENTS = {
  overview:  OverviewTab,
  instagram: InstagramTab,
  linkedin:  LinkedinTab,
  site:      Ga4Tab,
  temas:     TemasTab,
  campanhas: CampanhasTab,
  listening: ListeningTab,
};

export default function ClientDashboardPage() {
  const { slug } = useParams();
  const { client, clientUser, logout } = useClientAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const clientId     = client?.id;
  const clientName   = client?.name;
  const TabComponent = TAB_COMPONENTS[activeTab] ?? OverviewTab;

  if (!clientId) return null;

  return (
    <ClientContext.Provider value={clientId}>
      <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'DM Sans', -apple-system, sans-serif", padding: "0 0 60px" }}>

        {/* Top bar */}
        <div style={{ background: `linear-gradient(135deg, ${C.primaryDark}15 0%, ${C.bg} 50%, ${C.linkedin}08 100%)`, borderBottom: `1px solid ${C.border}`, padding: "18px 24px 0" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>

            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              {/* Client info */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: C.primary + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: C.primaryLight, flexShrink: 0 }}>
                  {(clientName || "?")[0].toUpperCase()}
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: C.text }}>
                    {clientName}
                  </h1>
                  <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>Painel de Mídias Sociais</p>
                </div>
              </div>

              {/* User + logout */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>{clientUser?.name}</span>
                <button
                  onClick={() => logout(slug)}
                  title="Sair"
                  style={{ display: "flex", padding: 6, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 0 }}>
              {TABS.map((t) => {
                const Icon = t.icon;
                const isA  = activeTab === t.id;
                return (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: "9px 9px 0 0", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap", background: isA ? C.bg : "transparent", color: isA ? C.primaryLight : C.textMuted, boxShadow: isA ? `inset 0 2px 0 ${C.primary}` : "none" }}>
                    <Icon size={14} />{t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* Content — cliente final: Campanhas e Social Listening em modo leitura */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "22px 24px" }}>
          <TabComponent readOnly />
        </div>
      </div>
    </ClientContext.Provider>
  );
}
