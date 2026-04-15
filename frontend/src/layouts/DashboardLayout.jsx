import React from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Globe, Layers, LogOut, ArrowLeft, Users } from "lucide-react";
import { C } from "../utils/colors";
import { useAuth } from "../contexts/AuthContext";

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
  { id: "overview",   label: "Visão Geral",     icon: BarChart3 },
  { id: "instagram",  label: "Instagram",        icon: InstagramIcon },
  { id: "linkedin",   label: "LinkedIn",         icon: LinkedinIcon },
  { id: "site",       label: "Site (GA4)",       icon: Globe },
  { id: "temas",      label: "Temas & Conteúdo", icon: Layers },
];

// clientName e clientId vêm do DashboardPage via props
export default function DashboardLayout({ activeTab, onTabChange, clientName, clientId, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'DM Sans', -apple-system, sans-serif", padding: "0 0 60px" }}>

      {/* Top bar */}
      <div style={{ background: `linear-gradient(135deg, ${C.primaryDark}15 0%, ${C.bg} 50%, ${C.linkedin}08 100%)`, borderBottom: `1px solid ${C.border}`, padding: "18px 24px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Breadcrumb + actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Back */}
              <button
                onClick={() => navigate(clientId ? `/clients/${clientId}` : "/clients")}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, fontSize: 12, fontFamily: "inherit" }}
              >
                <ArrowLeft size={13} /> Clientes
              </button>

              <span style={{ color: C.textDim, fontSize: 13 }}>/</span>

              {/* System brand (small) */}
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 8, color: "#fff", letterSpacing: "-0.02em", flexShrink: 0 }}>
                  CRT
                </div>
                <span style={{ fontSize: 12, color: C.textDim, fontWeight: 600 }}>CRT Ecosystem</span>
              </div>

              <span style={{ color: C.textDim, fontSize: 13 }}>/</span>

              {/* Client name */}
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                {clientName || "Cliente"}
              </span>
            </div>

            {/* Right actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: C.textMuted }}>{user?.name}</span>
              <button onClick={logout} title="Sair" style={{ display: "flex", padding: 6, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted }}>
                <LogOut size={13} />
              </button>
            </div>
          </div>

          {/* Client header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: C.primary + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: C.primaryLight, flexShrink: 0 }}>
              {(clientName || "?")[0].toUpperCase()}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: C.text }}>
                {clientName || "Dashboard do Cliente"}
              </h1>
              <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>Dashboard de Mídias Sociais · Abril/2025 a Janeiro/2026</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 0 }}>
            {TABS.map((t) => {
              const Icon = t.icon;
              const isA  = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => onTabChange(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: "9px 9px 0 0", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap", background: isA ? C.bg : "transparent", color: isA ? C.primaryLight : C.textMuted, boxShadow: isA ? `inset 0 2px 0 ${C.primary}` : "none" }}>
                  <Icon size={14} />{t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "22px 24px" }}>
        {children}
      </div>

    </div>
  );
}
