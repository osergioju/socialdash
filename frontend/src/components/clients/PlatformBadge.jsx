import React from "react";
import { C } from "../../utils/colors";

const PLATFORM_META = {
  META: {
    label: "Meta",
    color: "#1877F2",
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
      </svg>
    ),
  },
  GOOGLE_ANALYTICS: {
    label: "GA4",
    color: "#4285F4",
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  LINKEDIN: {
    label: "LinkedIn",
    color: "#0A66C2",
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
};

const STATUS_STYLE = {
  CONNECTED: { bg: "#10B98120", color: "#10B981", dot: "#10B981", label: "Conectado" },
  PENDING:   { bg: "#94A3B820", color: "#94A3B8", dot: "#94A3B8", label: "Pendente"  },
  EXPIRED:   { bg: "#F59E0B20", color: "#F59E0B", dot: "#F59E0B", label: "Expirado"  },
  REVOKED:   { bg: "#EF444420", color: "#EF4444", dot: "#EF4444", label: "Revogado"  },
  ERROR:     { bg: "#EF444420", color: "#EF4444", dot: "#EF4444", label: "Erro"       },
  undefined: { bg: "#1E293B",   color: "#475569", dot: "#475569", label: "Não conectado" },
};

export default function PlatformBadge({ platform, status, accountName }) {
  const meta  = PLATFORM_META[platform];
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.undefined;
  if (!meta) return null;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 8px", borderRadius: 6, background: style.bg, border: `1px solid ${style.dot}30` }} title={accountName || style.label}>
      <span style={{ color: meta.color }}>{meta.icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: style.color }}>{meta.label}</span>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: style.dot, flexShrink: 0 }} />
    </div>
  );
}

export { PLATFORM_META, STATUS_STYLE };
