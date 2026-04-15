import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { C } from "../../utils/colors";

export default function MetricCard({ title, value, variation, icon: Icon, color, subtitle, small }) {
  const isPos = parseFloat(variation) > 0;

  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.card} 0%, ${C.cardHover} 100%)`,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: small ? "14px 16px" : "18px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: color, opacity: 0.06 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{ background: color + "20", borderRadius: 7, padding: 5, display: "flex" }}>
          <Icon size={small ? 13 : 15} color={color} />
        </div>
        <span style={{ color: C.textMuted, fontSize: small ? 10 : 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
      </div>
      <div style={{ fontSize: small ? 20 : 26, fontWeight: 700, color: C.text, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.1 }}>
        {value ?? "—"}
      </div>
      {variation != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 5 }}>
          {isPos ? <ArrowUpRight size={12} color={C.green} /> : <ArrowDownRight size={12} color={C.red} />}
          <span style={{ fontSize: 11, fontWeight: 600, color: isPos ? C.green : C.red }}>{isPos ? "+" : ""}{variation}%</span>
          <span style={{ fontSize: 10, color: C.textDim }}>{subtitle || "vs anterior"}</span>
        </div>
      )}
    </div>
  );
}
