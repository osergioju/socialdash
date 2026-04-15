import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, ExternalLink, Trash2, ChevronRight, Globe, Building2 } from "lucide-react";
import AgencyLayout from "../layouts/AgencyLayout";
import { useClients } from "../hooks/useClients";
import { clientApi } from "../services/clientApi";
import { LoadingState, ErrorState } from "../components/ui/LoadingState";
import CreateClientModal from "../components/clients/CreateClientModal";
import PlatformBadge from "../components/clients/PlatformBadge";
import { C } from "../utils/colors";

export default function ClientsPage() {
  const { clients, loading, error, reload } = useClients();
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const navigate = useNavigate();

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm("Excluir este cliente e todas as conexões?")) return;
    setDeleting(id);
    await clientApi.remove(id).catch(() => null);
    reload();
    setDeleting(null);
  }

  return (
    <AgencyLayout>
      <div style={{ padding: "32px 36px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text }}>Clientes</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: C.textMuted }}>
              Gerencie clientes e suas conexões com plataformas
            </p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
            <Plus size={15} /> Novo Cliente
          </button>
        </div>

        {loading && <LoadingState />}
        {error   && <ErrorState message={error} onRetry={reload} />}

        {!loading && !error && clients.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Building2 size={48} color={C.textDim} style={{ marginBottom: 14 }} />
            <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>Nenhum cliente ainda.</p>
            <p style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>Clique em "Novo Cliente" para começar.</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {clients.map(client => (
            <div
              key={client.id}
              onClick={() => navigate(`/clients/${client.id}`)}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px", cursor: "pointer", transition: "border-color 0.15s", position: "relative" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.primary + "60"}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              {/* Avatar + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                {client.logoUrl ? (
                  <img src={client.logoUrl} alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover", background: C.border }} />
                ) : (
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: C.primary + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: C.primaryLight }}>
                    {client.name[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{client.name}</div>
                  {client.website && (
                    <div style={{ fontSize: 11, color: C.textDim, display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                      <Globe size={10} />{client.website.replace(/^https?:\/\//, "")}
                    </div>
                  )}
                </div>
                <ChevronRight size={16} color={C.textDim} />
              </div>

              {/* Platform badges */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["META", "GOOGLE_ANALYTICS", "LINKEDIN"].map(p => {
                  const conn = client.connections?.find(c => c.platform === p);
                  return <PlatformBadge key={p} platform={p} status={conn?.status} accountName={conn?.accountName} />;
                })}
              </div>

              {/* Delete */}
              <button
                onClick={e => handleDelete(e, client.id)}
                disabled={deleting === client.id}
                style={{ position: "absolute", top: 14, right: 14, padding: 6, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textDim, display: "flex", opacity: 0.6 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#EF4444"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.color = C.textDim; }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <CreateClientModal
          onClose={() => setShowModal(false)}
          onCreate={() => { setShowModal(false); reload(); }}
        />
      )}
    </AgencyLayout>
  );
}
