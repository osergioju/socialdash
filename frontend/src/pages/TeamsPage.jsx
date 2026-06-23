import React, { useEffect, useState } from "react";
import { Plus, Trash2, UserPlus, X, UsersRound, Building2 } from "lucide-react";
import AgencyLayout from "../layouts/AgencyLayout";
import { teamsApi } from "../services/api";
import { clientApi } from "../services/clientApi";
import { LoadingState, ErrorState } from "../components/ui/LoadingState";
import { C } from "../utils/colors";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [selected, setSelected] = useState(null); // team detail
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    setLoading(true); setError(null);
    try {
      const [t, u, c] = await Promise.all([teamsApi.list(), teamsApi.users(), clientApi.list()]);
      setTeams(t); setUsers(u); setAllClients(c);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  }
  useEffect(() => { loadAll(); }, []);

  async function openTeam(id) {
    setSelected(await teamsApi.get(id));
  }
  async function refreshSelected() {
    if (selected) setSelected(await teamsApi.get(selected.id));
    loadAll();
  }

  async function createTeam() {
    if (newName.trim().length < 2) return;
    setBusy(true);
    try { await teamsApi.create(newName.trim()); setNewName(""); await loadAll(); }
    catch (e) { alert(e.response?.data?.error || e.message); }
    finally { setBusy(false); }
  }

  async function removeTeam(id) {
    if (!confirm("Excluir este time? Os clientes ficam sem time (não são apagados).")) return;
    await teamsApi.remove(id).catch((e) => alert(e.response?.data?.error || e.message));
    if (selected?.id === id) setSelected(null);
    loadAll();
  }

  async function addMember(userId) {
    if (!userId) return;
    await teamsApi.addMember(selected.id, userId).catch((e) => alert(e.response?.data?.error || e.message));
    refreshSelected();
  }
  async function removeMember(userId) {
    await teamsApi.removeMember(selected.id, userId).catch((e) => alert(e.response?.data?.error || e.message));
    refreshSelected();
  }

  async function addClient(clientId) {
    if (!clientId) return;
    await teamsApi.setClientTeam(clientId, selected.id).catch((e) => alert(e.response?.data?.error || e.message));
    refreshSelected();
  }
  async function unlinkClient(clientId) {
    await teamsApi.setClientTeam(clientId, null).catch((e) => alert(e.response?.data?.error || e.message));
    refreshSelected();
  }

  const memberIds = new Set((selected?.members || []).map((m) => m.id));
  const clientIdsInTeam = new Set((selected?.clients || []).map((c) => c.id));
  const availableUsers = users.filter((u) => !memberIds.has(u.id));
  const availableClients = allClients.filter((c) => !clientIdsInTeam.has(c.id));

  return (
    <AgencyLayout>
      <div style={{ padding: "32px 36px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text }}>Times</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.textMuted }}>
            Crie times, adicione usuários e defina quais clientes cada time enxerga.
          </p>
        </div>

        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={loadAll} />}

        {!loading && !error && (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>
            {/* Coluna esquerda: lista + criar */}
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input
                  value={newName} onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createTeam()}
                  placeholder="Nome do novo time"
                  style={inputStyle}
                />
                <button onClick={createTeam} disabled={busy} style={primaryBtn}><Plus size={15} /></button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {teams.map((t) => (
                  <div key={t.id} onClick={() => openTeam(t.id)}
                    style={{
                      ...card, cursor: "pointer",
                      outline: selected?.id === t.id ? `1px solid ${C.primary}` : "none",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <UsersRound size={15} color={C.primaryLight} />
                        <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{t.name}</span>
                      </div>
                      <Trash2 size={14} color={C.textDim} onClick={(e) => { e.stopPropagation(); removeTeam(t.id); }} style={{ cursor: "pointer" }} />
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
                      {t.memberCount} membro(s) · {t.clientCount} cliente(s)
                    </div>
                  </div>
                ))}
                {teams.length === 0 && <p style={{ color: C.textDim, fontSize: 13 }}>Nenhum time ainda.</p>}
              </div>
            </div>

            {/* Coluna direita: detalhe */}
            <div>
              {!selected && (
                <div style={{ ...card, textAlign: "center", padding: 40, color: C.textMuted }}>
                  Selecione um time para gerenciar membros e clientes.
                </div>
              )}

              {selected && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>{selected.name}</h2>

                  {/* Membros */}
                  <div style={card}>
                    <SectionTitle icon={UserPlus} text="Membros" />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "10px 0" }}>
                      {selected.members.map((m) => (
                        <span key={m.id} style={chip}>
                          {m.name} <span style={{ color: C.textDim }}>· {m.role}</span>
                          <X size={12} style={{ cursor: "pointer" }} onClick={() => removeMember(m.id)} />
                        </span>
                      ))}
                      {selected.members.length === 0 && <span style={{ color: C.textDim, fontSize: 12 }}>Nenhum membro.</span>}
                    </div>
                    <select onChange={(e) => { addMember(e.target.value); e.target.value = ""; }} defaultValue="" style={selectStyle}>
                      <option value="" disabled>+ Adicionar usuário…</option>
                      {availableUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                    </select>
                  </div>

                  {/* Clientes */}
                  <div style={card}>
                    <SectionTitle icon={Building2} text="Clientes do time" />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "10px 0" }}>
                      {selected.clients.map((c) => (
                        <span key={c.id} style={chip}>
                          {c.name}
                          <X size={12} style={{ cursor: "pointer" }} onClick={() => unlinkClient(c.id)} />
                        </span>
                      ))}
                      {selected.clients.length === 0 && <span style={{ color: C.textDim, fontSize: 12 }}>Nenhum cliente.</span>}
                    </div>
                    <select onChange={(e) => { addClient(e.target.value); e.target.value = ""; }} defaultValue="" style={selectStyle}>
                      <option value="" disabled>+ Vincular cliente…</option>
                      {availableClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AgencyLayout>
  );
}

function SectionTitle({ icon: Icon, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: C.text }}>
      <Icon size={14} color={C.primaryLight} /> {text}
    </div>
  );
}

const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 };
const inputStyle = { flex: 1, padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" };
const selectStyle = { ...inputStyle, width: "100%", cursor: "pointer" };
const primaryBtn = { display: "flex", alignItems: "center", justifyContent: "center", padding: "0 14px", borderRadius: 9, border: "none", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff", cursor: "pointer" };
const chip = { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20, background: C.bg, border: `1px solid ${C.border}`, fontSize: 12, color: C.text };
