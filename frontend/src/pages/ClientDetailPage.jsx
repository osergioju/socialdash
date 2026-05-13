import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Clock, XCircle, Unlink, ExternalLink, Globe, StickyNote, BarChart3, Instagram, BarChart2, Building2 } from "lucide-react";
import AgencyLayout from "../layouts/AgencyLayout";
import { useClient } from "../hooks/useClients";
import { oauthApi } from "../services/clientApi";
import { LoadingState, ErrorState } from "../components/ui/LoadingState";
import { PLATFORM_META, STATUS_STYLE } from "../components/clients/PlatformBadge";
import { C } from "../utils/colors";

// ─── Modal de seleção de página Meta (multi-tenant fix) ───────────────────────
function MetaPageSelectorModal({ clientId, onClose, onSaved }) {
  const [pages, setPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [err, setErr] = useState("");

  React.useEffect(() => {
    oauthApi.listMetaPages(clientId)
      .then(setPages)
      .catch(e => setErr(e.response?.data?.error || "Erro ao carregar páginas"))
      .finally(() => setLoading(false));
  }, [clientId]);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setErr("");
    try {
      await oauthApi.selectMetaPage(clientId, selected);
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || "Erro ao salvar página");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000080", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, width: "100%", maxWidth: 480, padding: "28px 28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: C.text }}>Selecionar Página do Facebook</h3>
          <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
            Escolha qual página corresponde a este cliente. Cada cliente deve ter sua própria página vinculada.
          </p>
        </div>

        {loading && <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: "20px 0" }}>Carregando páginas...</div>}

        {!loading && !err && pages?.length === 0 && (
          <div style={{ fontSize: 13, color: "#F59E0B", padding: "12px 14px", background: "#F59E0B15", borderRadius: 9 }}>
            Nenhuma página com Instagram Business encontrada nesta conta Meta.
          </div>
        )}

        {!loading && pages && pages.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pages.map((p) => (
              <button key={p.pageId} onClick={() => setSelected(p.pageId)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: `2px solid ${selected === p.pageId ? "#1877F2" : C.border}`, background: selected === p.pageId ? "#1877F215" : C.cardHover, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#1877F215", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 18 }}>📄</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{p.pageName}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>
                    Instagram: <strong style={{ color: C.text }}>@{p.instagramUsername || p.instagramName}</strong>
                    {p.followersCount > 0 && ` · ${p.followersCount.toLocaleString("pt-BR")} seguidores`}
                  </div>
                </div>
                {selected === p.pageId && <CheckCircle2 size={18} color="#1877F2" style={{ flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        )}

        {err && <p style={{ margin: 0, fontSize: 12, color: "#EF4444", padding: "8px 12px", background: "#EF444415", borderRadius: 7 }}>{err}</p>}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, fontSize: 13, fontFamily: "inherit" }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!selected || saving} style={{ flex: 2, padding: "10px", borderRadius: 9, border: "none", background: (!selected || saving) ? C.border : "#1877F2", color: (!selected || saving) ? C.textDim : "#fff", cursor: (!selected || saving) ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
            {saving ? "Salvando..." : "Confirmar Página"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de seleção de propriedade GA4 ─────────────────────────────────────
function Ga4PropertySelectorModal({ clientId, onClose, onSaved }) {
  const [properties, setProperties] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [err, setErr] = useState("");

  React.useEffect(() => {
    oauthApi.listGa4Properties(clientId)
      .then(setProperties)
      .catch(e => setErr(e.response?.data?.error || "Erro ao carregar propriedades"))
      .finally(() => setLoading(false));
  }, [clientId]);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setErr("");
    try {
      await oauthApi.selectGa4Property(clientId, selected);
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || "Erro ao salvar propriedade");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000080", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, width: "100%", maxWidth: 480, padding: "28px 28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: C.text }}>Selecionar Propriedade GA4</h3>
          <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
            Escolha qual propriedade do Google Analytics corresponde a este cliente.
          </p>
        </div>

        {loading && <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: "20px 0" }}>Carregando propriedades...</div>}

        {!loading && !err && properties?.length === 0 && (
          <div style={{ fontSize: 13, color: "#F59E0B", padding: "12px 14px", background: "#F59E0B15", borderRadius: 9 }}>
            Nenhuma propriedade GA4 encontrada nesta conta Google.
          </div>
        )}

        {!loading && properties && properties.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {properties.map((p) => (
              <button key={p.propertyId} onClick={() => setSelected(p.propertyId)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: `2px solid ${selected === p.propertyId ? "#4285F4" : C.border}`, background: selected === p.propertyId ? "#4285F415" : C.cardHover, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#4285F415", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BarChart2 size={18} color="#4285F4" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{p.propertyName}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{p.accountName} · <span style={{ fontFamily: "monospace", fontSize: 10 }}>{p.propertyId}</span></div>
                </div>
                {selected === p.propertyId && <CheckCircle2 size={18} color="#4285F4" style={{ flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        )}

        {err && <p style={{ margin: 0, fontSize: 12, color: "#EF4444", padding: "8px 12px", background: "#EF444415", borderRadius: 7 }}>{err}</p>}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, fontSize: 13, fontFamily: "inherit" }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!selected || saving} style={{ flex: 2, padding: "10px", borderRadius: 9, border: "none", background: (!selected || saving) ? C.border : "#4285F4", color: (!selected || saving) ? C.textDim : "#fff", cursor: (!selected || saving) ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
            {saving ? "Salvando..." : "Confirmar Propriedade"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de seleção de organização LinkedIn ─────────────────────────────────
function LinkedinOrgSelectorModal({ clientId, onClose, onSaved }) {
  const [orgs, setOrgs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [err, setErr] = useState("");

  React.useEffect(() => {
    oauthApi.listLinkedinOrgs(clientId)
      .then(setOrgs)
      .catch(e => setErr(e.response?.data?.error || "Erro ao carregar organizações"))
      .finally(() => setLoading(false));
  }, [clientId]);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setErr("");
    try {
      await oauthApi.selectLinkedinOrg(clientId, selected);
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || "Erro ao salvar organização");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000080", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, width: "100%", maxWidth: 480, padding: "28px 28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: C.text }}>Selecionar Organização LinkedIn</h3>
          <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
            Escolha qual organização LinkedIn corresponde a este cliente.
          </p>
        </div>

        {loading && <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: "20px 0" }}>Carregando organizações...</div>}

        {!loading && !err && orgs?.length === 0 && (
          <div style={{ fontSize: 13, color: "#F59E0B", padding: "12px 14px", background: "#F59E0B15", borderRadius: 9 }}>
            Nenhuma organização encontrada. Verifique se você é administrador de alguma página.
          </div>
        )}

        {!loading && orgs && orgs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {orgs.map((o) => (
              <button key={o.organizationUrn} onClick={() => setSelected(o.organizationUrn)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: `2px solid ${selected === o.organizationUrn ? "#0A66C2" : C.border}`, background: selected === o.organizationUrn ? "#0A66C215" : C.cardHover, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#0A66C215", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Building2 size={18} color="#0A66C2" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{o.organizationName}</div>
                  {o.vanityName && <div style={{ fontSize: 11, color: C.textMuted }}>linkedin.com/company/{o.vanityName}</div>}
                </div>
                {selected === o.organizationUrn && <CheckCircle2 size={18} color="#0A66C2" style={{ flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        )}

        {err && <p style={{ margin: 0, fontSize: 12, color: "#EF4444", padding: "8px 12px", background: "#EF444415", borderRadius: 7 }}>{err}</p>}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, fontSize: 13, fontFamily: "inherit" }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!selected || saving} style={{ flex: 2, padding: "10px", borderRadius: 9, border: "none", background: (!selected || saving) ? C.border : "#0A66C2", color: (!selected || saving) ? C.textDim : "#fff", cursor: (!selected || saving) ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
            {saving ? "Salvando..." : "Confirmar Organização"}
          </button>
        </div>
      </div>
    </div>
  );
}

const PLATFORMS = [
  {
    key: "META",
    route: "meta",
    name: "Meta (Instagram + Facebook)",
    description: "Insights de Instagram, alcance, engajamento e crescimento de seguidores.",
    scopes: ["Leitura de métricas do Instagram", "Insights de páginas do Facebook", "Gerenciamento de comentários"],
  },
  {
    key: "GOOGLE_ANALYTICS",
    route: "google",
    name: "Google Analytics (GA4)",
    description: "Usuários, sessões, taxa de engajamento e fontes de tráfego do site.",
    scopes: ["Leitura de propriedades GA4", "Relatórios de análise do site"],
  },
  {
    key: "LINKEDIN",
    route: "linkedin",
    name: "LinkedIn",
    description: "Seguidores, alcance, impressões e engajamento da página corporativa.",
    scopes: ["Social da organização", "Admin da organização", "Perfil básico"],
  },
];

function StatusIcon({ status }) {
  const size = 16;
  if (status === "CONNECTED") return <CheckCircle2 size={size} color="#10B981" />;
  if (status === "EXPIRED") return <Clock size={size} color="#F59E0B" />;
  if (status === "ERROR") return <AlertCircle size={size} color="#EF4444" />;
  if (status === "REVOKED") return <XCircle size={size} color="#EF4444" />;
  return <div style={{ width: size, height: size, borderRadius: "50%", border: `2px dashed ${C.textDim}` }} />;
}

function PlatformCard({ platform, connection, clientId, onUpdate }) {
  const [connecting, setConnecting] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [showGa4Selector, setShowGa4Selector] = useState(false);
  const [showLinkedinSelector, setShowLinkedinSelector] = useState(false);
  const [err, setErr] = useState("");

  const meta = PLATFORM_META[platform.key];
  const status = connection?.status;
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.undefined;

  async function handleConnect() {
    setConnecting(true);
    setErr("");
    try {
      const url = await oauthApi.getConnectUrl(platform.route, clientId);
      // Navigate to provider — when callback returns, OAuthCallbackPage reloads this page
      window.location.href = url;
    } catch (e) {
      setErr(e.response?.data?.error || "Erro ao iniciar conexão");
      setConnecting(false);
    }
  }

  async function handleRevoke() {
    if (!confirm(`Desconectar ${platform.name}?`)) return;
    setRevoking(true);
    setErr("");
    try {
      await oauthApi.revoke(platform.route, clientId);
      onUpdate();
    } catch (e) {
      setErr(e.response?.data?.error || "Erro ao revogar");
    } finally {
      setRevoking(false);
    }
  }

  const isConnected = status === "CONNECTED";
  const needsPageSelection = platform.key === "META" && isConnected && !connection?.pageSelected;
  const needsPropertySelection = platform.key === "GOOGLE_ANALYTICS" && isConnected && !connection?.propertySelected;
  const needsOrgSelection = platform.key === "LINKEDIN" && isConnected && !connection?.orgSelected;
  const needsSelection = needsPageSelection || needsPropertySelection || needsOrgSelection;

  return (
    <>
      {showPageSelector && (
        <MetaPageSelectorModal
          clientId={clientId}
          onClose={() => setShowPageSelector(false)}
          onSaved={() => { setShowPageSelector(false); onUpdate(); }}
        />
      )}
      {showGa4Selector && (
        <Ga4PropertySelectorModal
          clientId={clientId}
          onClose={() => setShowGa4Selector(false)}
          onSaved={() => { setShowGa4Selector(false); onUpdate(); }}
        />
      )}
      {showLinkedinSelector && (
        <LinkedinOrgSelectorModal
          clientId={clientId}
          onClose={() => setShowLinkedinSelector(false)}
          onSaved={() => { setShowLinkedinSelector(false); onUpdate(); }}
        />
      )}
      <div style={{ background: C.card, border: `1px solid ${needsSelection ? "#F59E0B60" : isConnected ? meta.color + "40" : C.border}`, borderRadius: 14, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: meta.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: meta.color, transform: "scale(1.8)", display: "flex" }}>{meta.icon}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{platform.name}</span>
              <StatusIcon status={status} />
            </div>
            <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{platform.description}</p>
          </div>
        </div>

        {/* Status detail */}
        <div style={{ background: C.cardHover, borderRadius: 9, padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: isConnected ? 6 : 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: style.dot, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: style.color }}>{style.label}</span>
          </div>
          {isConnected && connection?.accountName && (
            <div style={{ fontSize: 11, color: C.textMuted }}>
              Conta: <strong style={{ color: C.text }}>{connection.accountName}</strong>
              {connection.accountEmail && ` · ${connection.accountEmail}`}
            </div>
          )}
          {isConnected && platform.key === "META" && connection?.pageSelected && (
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
              Página: <strong style={{ color: C.text }}>{connection.pageName}</strong>
              {connection.instagramUsername && <> · <strong style={{ color: "#E1306C" }}>@{connection.instagramUsername}</strong></>}
            </div>
          )}
          {needsPageSelection && (
            <div style={{ fontSize: 11, color: "#F59E0B", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
              <AlertCircle size={11} /> Página Instagram não selecionada — sync bloqueado
            </div>
          )}
          {isConnected && platform.key === "GOOGLE_ANALYTICS" && connection?.propertySelected && (
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
              Propriedade: <strong style={{ color: C.text }}>{connection.propertyName || connection.propertyId}</strong>
            </div>
          )}
          {needsPropertySelection && (
            <div style={{ fontSize: 11, color: "#F59E0B", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
              <AlertCircle size={11} /> Propriedade GA4 não selecionada — sync bloqueado
            </div>
          )}
          {isConnected && platform.key === "LINKEDIN" && connection?.orgSelected && (
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
              Organização: <strong style={{ color: C.text }}>{connection.organizationName}</strong>
            </div>
          )}
          {needsOrgSelection && (
            <div style={{ fontSize: 11, color: "#F59E0B", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
              <AlertCircle size={11} /> Organização LinkedIn não selecionada — sync bloqueado
            </div>
          )}
          {isConnected && connection?.connectedAt && (
            <div style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>
              Conectado em {new Date(connection.connectedAt).toLocaleDateString("pt-BR")}
              {connection.expiresAt && ` · Expira em ${new Date(connection.expiresAt).toLocaleDateString("pt-BR")}`}
            </div>
          )}
        </div>

        {/* Scopes */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Permissões solicitadas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {platform.scopes.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textMuted }}>
                <span style={{ color: "#10B981", fontSize: 12 }}>✓</span>{s}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {err && <p style={{ margin: 0, fontSize: 11, color: "#EF4444", padding: "6px 10px", background: "#EF444415", borderRadius: 7 }}>{err}</p>}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto", flexWrap: "wrap" }}>
          {!isConnected ? (
            <button onClick={handleConnect} disabled={connecting} style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", cursor: connecting ? "not-allowed" : "pointer", background: connecting ? C.border : meta.color, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {connecting ? (
                <><RefreshCw size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Aguarde...</>
              ) : (
                <><ExternalLink size={13} /> Conectar</>
              )}
            </button>
          ) : (
            <>
              {platform.key === "META" && (
                <button onClick={() => setShowPageSelector(true)} style={{ flex: needsPageSelection ? 2 : 1, padding: "10px", borderRadius: 9, border: `2px solid ${needsPageSelection ? "#F59E0B" : meta.color + "40"}`, background: needsPageSelection ? "#F59E0B15" : "transparent", cursor: "pointer", color: needsPageSelection ? "#F59E0B" : meta.color, fontSize: 12, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Instagram size={12} /> {connection?.pageSelected ? "Trocar Página" : "Selecionar Página"}
                </button>
              )}
              {platform.key === "GOOGLE_ANALYTICS" && (
                <button onClick={() => setShowGa4Selector(true)} style={{ flex: needsPropertySelection ? 2 : 1, padding: "10px", borderRadius: 9, border: `2px solid ${needsPropertySelection ? "#F59E0B" : meta.color + "40"}`, background: needsPropertySelection ? "#F59E0B15" : "transparent", cursor: "pointer", color: needsPropertySelection ? "#F59E0B" : meta.color, fontSize: 12, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <BarChart2 size={12} /> {connection?.propertySelected ? "Trocar Propriedade" : "Selecionar Propriedade"}
                </button>
              )}
              {platform.key === "LINKEDIN" && (
                <button onClick={() => setShowLinkedinSelector(true)} style={{ flex: needsOrgSelection ? 2 : 1, padding: "10px", borderRadius: 9, border: `2px solid ${needsOrgSelection ? "#F59E0B" : meta.color + "40"}`, background: needsOrgSelection ? "#F59E0B15" : "transparent", cursor: "pointer", color: needsOrgSelection ? "#F59E0B" : meta.color, fontSize: 12, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Building2 size={12} /> {connection?.orgSelected ? "Trocar Organização" : "Selecionar Organização"}
                </button>
              )}
              {!needsSelection && (
                <button onClick={handleConnect} disabled={connecting} style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1px solid ${meta.color}40`, background: "transparent", cursor: connecting ? "not-allowed" : "pointer", color: meta.color, fontSize: 12, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <RefreshCw size={12} /> Reconectar
                </button>
              )}
              <button onClick={handleRevoke} disabled={revoking} style={{ padding: "10px 14px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", cursor: revoking ? "not-allowed" : "pointer", color: "#EF4444", fontSize: 12, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
                <Unlink size={12} /> {revoking ? "..." : "Desconectar"}
              </button>
            </>
          )}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { client, loading, error, reload } = useClient(id);

  if (loading) return <AgencyLayout><div style={{ padding: 40 }}><LoadingState /></div></AgencyLayout>;
  if (error) return <AgencyLayout><div style={{ padding: 40 }}><ErrorState message={error} /></div></AgencyLayout>;
  if (!client) return null;

  const connectedCount = client.connections?.filter(c => c.status === "CONNECTED").length ?? 0;

  return (
    <AgencyLayout>
      <div style={{ padding: "32px 36px" }}>
        {/* Back */}
        <button onClick={() => navigate("/clients")} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, padding: "6px 0", border: "none", background: "transparent", cursor: "pointer", color: C.textMuted, fontSize: 13, fontFamily: "inherit" }}>
          <ArrowLeft size={14} /> Voltar para Clientes
        </button>

        {/* Client header */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 26px", marginBottom: 28, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: C.primary + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: C.primaryLight, flexShrink: 0 }}>
            {client.logoUrl ? <img src={client.logoUrl} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover" }} /> : client.name[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>{client.name}</h1>
            {client.website && (
              <a href={client.website} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: C.primaryLight, marginTop: 3, textDecoration: "none" }}>
                <Globe size={11} />{client.website.replace(/^https?:\/\//, "")} <ExternalLink size={10} />
              </a>
            )}
            {client.notes && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 5, marginTop: 6, fontSize: 12, color: C.textMuted }}>
                <StickyNote size={12} style={{ marginTop: 1, flexShrink: 0 }} />{client.notes}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: connectedCount > 0 ? C.primaryLight : C.textDim }}>{connectedCount}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>plataforma{connectedCount !== 1 ? "s" : ""} conectada{connectedCount !== 1 ? "s" : ""}</div>
            </div>
            <button
              onClick={() => navigate(`/clients/${client.id}/dashboard`)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              <BarChart3 size={13} /> Ver Dashboard
            </button>
          </div>
        </div>

        {/* Section header */}
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>Conexões com Plataformas</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textMuted }}>
            Clique em "Conectar" para autorizar acesso via OAuth. Você será redirecionado para a plataforma e voltará automaticamente.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {PLATFORMS.map(p => (
            <PlatformCard
              key={p.key}
              platform={p}
              connection={client.connections?.find(c => c.platform === p.key)}
              clientId={client.id}
              onUpdate={reload}
            />
          ))}
        </div>
      </div>
    </AgencyLayout>
  );
}


