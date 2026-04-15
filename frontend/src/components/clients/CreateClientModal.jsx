import React, { useState } from "react";
import { X } from "lucide-react";
import { clientApi } from "../../services/clientApi";
import { C } from "../../utils/colors";

const inputStyle = {
  width: "100%", padding: "10px 13px", borderRadius: 9,
  border: `1px solid ${C.border}`, background: C.cardHover,
  color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

export default function CreateClientModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", website: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await clientApi.create({ name: form.name, website: form.website || undefined, notes: form.notes || undefined });
      onCreate();
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao criar cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 440, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, padding: 6, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, display: "flex" }}>
          <X size={15} />
        </button>

        <h2 style={{ margin: "0 0 22px", fontSize: 17, fontWeight: 700, color: C.text }}>Novo Cliente</h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>Nome *</label>
            <input required style={inputStyle} placeholder="Ex: EnergisaPrev" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>Site</label>
            <input style={inputStyle} type="url" placeholder="https://empresa.com.br" value={form.website} onChange={e => set("website", e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>Observações</label>
            <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Notas internas sobre o cliente..." value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>

          {error && <p style={{ margin: 0, fontSize: 12, color: "#EF4444", padding: "7px 12px", background: "#EF444415", borderRadius: 8 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: "10px", borderRadius: 9, border: "none", background: loading ? C.border : `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
              {loading ? "Criando..." : "Criar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
