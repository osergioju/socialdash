import React from "react";
import { C } from "../../utils/colors";

export function LoadingState({ message = "Carregando dados..." }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: `3px solid ${C.border}`,
        borderTopColor: C.primary,
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>{message}</p>
    </div>
  );
}

export function ErrorState({ message = "Erro ao carregar dados", onRetry }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12 }}>
      <p style={{ color: "#EF4444", fontSize: 14, margin: 0 }}>⚠ {message}</p>
      {onRetry && (
        <button onClick={onRetry} style={{ padding: "6px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
