import React, { useState } from "react";
import { ArrowLeft, Radar, BarChart3, MessageSquare, Sparkles, RefreshCw, Pencil } from "lucide-react";
import MonitoringFormModal from "./MonitoringFormModal";
import { useListeningDashboard } from "../../hooks/useListening";
import { listeningApi } from "../../services/api";
import { LoadingState, ErrorState } from "../ui/LoadingState";
import { C } from "../../utils/colors";
import ListeningDashboardTab from "../../pages/listening-tabs/ListeningDashboardTab";
import ListeningMentionsTab  from "../../pages/listening-tabs/ListeningMentionsTab";
import ListeningSummaryTab   from "../../pages/listening-tabs/ListeningSummaryTab";

const TABS = [
  { id: "dashboard", label: "Dashboard",        icon: BarChart3 },
  { id: "mentions",  label: "Menções",          icon: MessageSquare },
  { id: "summary",   label: "Resumo Executivo", icon: Sparkles },
];

// Visão completa de um monitoramento (sub-tabs), embutida na tab "Social
// Listening" dos dashboards. readOnly = cliente final: sem editar/coletar.
export default function ListeningDashboardView({ monitoringId, readOnly = false, onBack }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [days, setDays] = useState(30);
  const [collecting, setCollecting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const { data, loading, error, reload } = useListeningDashboard(monitoringId, days);

  const monitoring = data?.monitoring;

  async function handleCollect() {
    setCollecting(true);
    try {
      await listeningApi.collect(monitoringId);
      reload();
    } catch { /* erro aparece no reload */ }
    setCollecting(false);
  }

  function renderTab() {
    if (activeTab === "mentions") return <ListeningMentionsTab monitoringId={monitoringId} />;
    if (activeTab === "summary")  return <ListeningSummaryTab monitoringId={monitoringId} readOnly={readOnly} />;
    if (loading) return <LoadingState message="Carregando dashboard…" />;
    if (error)   return <ErrorState message={error} onRetry={reload} />;
    if (!data)   return null;
    return <ListeningDashboardTab data={data} days={days} onDaysChange={setDays} />;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, fontSize: 12, fontFamily: "inherit" }}
        >
          <ArrowLeft size={13} /> Monitoramentos
        </button>
        {!readOnly && (
          <button
            onClick={handleCollect}
            disabled={collecting}
            title="Buscar novas menções agora"
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: `1px solid ${collecting ? C.primary + "60" : C.border}`, background: collecting ? C.primary + "15" : "transparent", cursor: collecting ? "default" : "pointer", color: collecting ? C.primaryLight : C.textMuted, fontSize: 11, fontFamily: "inherit" }}
          >
            <RefreshCw size={12} style={{ animation: collecting ? "spin 1s linear infinite" : "none" }} />
            {collecting ? "Coletando…" : "Coletar agora"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: C.cyan + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Radar size={20} color={C.cyan} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: C.text }}>
              {monitoring?.name || "Monitoramento"}
            </h2>
            {!readOnly && monitoring && (
              <button onClick={() => setShowEdit(true)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, fontSize: 11, fontFamily: "inherit" }}>
                <Pencil size={11} /> Editar
              </button>
            )}
          </div>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: C.textMuted }}>
            Marca: {monitoring?.brand || "…"}
            {monitoring?.keywords?.length ? ` · ${monitoring.keywords.length} palavras-chave` : ""}
            {monitoring?.competitors?.length ? ` · ${monitoring.competitors.length} concorrentes` : ""}
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 3, overflowX: "auto", borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const isA = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: "9px 9px 0 0", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap", background: isA ? C.card : "transparent", color: isA ? C.primaryLight : C.textMuted, boxShadow: isA ? `inset 0 2px 0 ${C.cyan}` : "none" }}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {renderTab()}

      {showEdit && monitoring && !readOnly && (
        <MonitoringFormModal
          clientId={monitoring.clientId}
          monitoring={monitoring}
          onClose={() => setShowEdit(false)}
          onSave={() => { setShowEdit(false); reload(); }}
        />
      )}
    </div>
  );
}
