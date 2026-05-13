import React from "react";
import { NavLink } from "react-router-dom";
import { Users, LogOut, LayoutDashboard } from "lucide-react";
import { C } from "../utils/colors";
import { useAuth } from "../contexts/AuthContext";

const NAV = [
  { to: "/clients", icon: Users, label: "Clientes" },
];

export default function AgencyLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text }}>

      {/* Sidebar */}
      <aside style={{ width: 224, background: C.card, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>

        {/* Brand */}
        <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 11, color: "#fff", flexShrink: 0, letterSpacing: "-0.03em" }}>
              CRT
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.text, lineHeight: 1.1, letterSpacing: "-0.02em" }}>CRT Ecosystem</div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>Gestão de Mídias Sociaisxxxx</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 9, padding: "9px 12px",
              borderRadius: 9, textDecoration: "none", fontSize: 13, fontWeight: 600,
              background: isActive ? C.primary + "22" : "transparent",
              color: isActive ? C.primaryLight : C.textMuted,
              outline: isActive ? `1px solid ${C.primary}40` : "none",
            })}>
              <Icon size={15} />{label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 1 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10 }}>{user?.email}</div>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 12, fontFamily: "inherit", width: "100%" }}>
            <LogOut size={13} /> Sair
          </button>
        </div>

      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </main>

    </div>
  );
}
