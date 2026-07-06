import React, { useEffect } from "react";
import { useClients } from "../../hooks/useClients";
import { C } from "../../utils/colors";

// Seletor de cliente usado pelos módulos de nível agência (Campanhas, Social
// Listening). Persiste a escolha em localStorage para manter o contexto.
export default function ClientSelect({ value, onChange, storageKey = "selected_client" }) {
  const { clients, loading } = useClients();

  useEffect(() => {
    if (loading || value) return;
    const saved = localStorage.getItem(storageKey);
    const valid = clients.find((c) => c.id === saved) || clients[0];
    if (valid) onChange(valid.id);
  }, [loading, clients, value, onChange, storageKey]);

  function handleChange(e) {
    localStorage.setItem(storageKey, e.target.value);
    onChange(e.target.value);
  }

  return (
    <select
      value={value || ""}
      onChange={handleChange}
      style={{
        padding: "9px 13px", borderRadius: 9, border: `1px solid ${C.border}`,
        background: C.cardHover, color: C.text, fontSize: 13, fontFamily: "inherit",
        outline: "none", cursor: "pointer", minWidth: 200,
      }}
    >
      {loading && <option value="">Carregando…</option>}
      {!loading && clients.length === 0 && <option value="">Nenhum cliente</option>}
      {clients.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}
