import React from "react";
import { C } from "../../utils/colors";

export default function SectionHeader({ icon: Icon, title, subtitle, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, marginTop: 40 }}>
      <div style={{ background: `linear-gradient(135deg, ${color}30, ${color}10)`, border: `1px solid ${color}40`, borderRadius: 12, padding: 10, display: "flex" }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: C.textMuted, margin: 0, marginTop: 2 }}>{subtitle}</p>}
      </div>
    </div>
  );
}
