import React from "react";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

export default function ThemeRankCard({ themes, platform }) {
  const maxVal = Math.max(...themes.map((t) => (platform === "ig" ? t.curtidas : t.engajamento)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {themes.map((t, i) => {
        const val = platform === "ig" ? t.curtidas : t.engajamento;
        const color = platform === "ig" ? C.instagram : C.linkedin;
        const colorLight = platform === "ig" ? C.instagramLight : C.linkedinLight;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{t.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{t.tema}</span>
                <span style={{ fontSize: 11, color: C.textMuted }}>{fmt(val)}</span>
              </div>
              <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(val / maxVal) * 100}%`, background: `linear-gradient(90deg, ${color}, ${colorLight})`, borderRadius: 3 }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
