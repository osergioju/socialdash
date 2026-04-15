import React from "react";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

export default function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
      <p style={{ margin: 0, fontSize: 11, color: C.textMuted, marginBottom: 6 }}>{label}</p>
      {payload.filter((p) => p.value != null).map((p, i) => (
        <p key={i} style={{ margin: "2px 0", fontSize: 12, fontWeight: 600, color: p.color || C.text }}>
          {p.name}: {typeof p.value === "number" && p.value > 999 ? fmt(p.value) : p.value}{p.unit || ""}
        </p>
      ))}
    </div>
  );
}
