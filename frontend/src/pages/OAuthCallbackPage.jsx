import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { C } from "../utils/colors";

const PLATFORM_LABELS = {
  META:             "Meta (Instagram/Facebook)",
  GOOGLE_ANALYTICS: "Google Analytics",
  LINKEDIN:         "LinkedIn",
};

export default function OAuthCallbackPage() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const [count, setCount] = useState(4);

  const success    = params.get("success") === "true";
  const platform   = params.get("platform");
  const clientId   = params.get("clientId");
  const errorMsg   = params.get("error");
  const NEEDS_SELECTION = ["GOOGLE_ANALYTICS", "LINKEDIN"];
  const needsSelector  = success && platform && NEEDS_SELECTION.includes(platform);
  const target         = clientId
    ? `/clients/${clientId}${needsSelector ? `?selectPlatform=${platform}` : ""}`
    : "/clients";

  useEffect(() => {
    const t = setInterval(() => setCount(c => c - 1), 1000);
    const r = setTimeout(() => navigate(target), 4000);
    return () => { clearInterval(t); clearTimeout(r); };
  }, [target, navigate]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "40px 48px", textAlign: "center", maxWidth: 420 }}>
        {success ? (
          <>
            <CheckCircle2 size={52} color="#10B981" style={{ marginBottom: 16 }} />
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: C.text }}>Conectado com sucesso!</h2>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
              {PLATFORM_LABELS[platform] || platform} foi conectado e os dados já estão disponíveis.
            </p>
          </>
        ) : (
          <>
            <XCircle size={52} color="#EF4444" style={{ marginBottom: 16 }} />
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: C.text }}>Falha na conexão</h2>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
              {decodeURIComponent(errorMsg || "Ocorreu um erro durante a autorização.")}
            </p>
          </>
        )}

        <div style={{ marginTop: 24, padding: "10px 16px", background: C.cardHover, borderRadius: 9 }}>
          <span style={{ fontSize: 12, color: C.textDim }}>
            Redirecionando em <strong style={{ color: C.text }}>{count}s</strong>…
          </span>
        </div>

        <button onClick={() => navigate(target)} style={{ marginTop: 14, width: "100%", padding: "11px", borderRadius: 9, border: "none", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
          Voltar agora
        </button>
      </div>
    </div>
  );
}
