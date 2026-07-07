import React, { useState } from "react";
import { X } from "lucide-react";
import { campaignsApi } from "../../services/api";
import { C } from "../../utils/colors";

const inputStyle = {
  width: "100%", padding: "10px 13px", borderRadius: 9,
  border: `1px solid ${C.border}`, background: C.cardHover,
  color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 5 };

function toInputDate(d) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

// Cadastro enxuto: a campanha é só um agrupador de conteúdos já existentes —
// nome, descrição e período. A seleção de conteúdos acontece na tela da campanha.
export default function CampaignFormModal({ clientId, campaign, onClose, onSave }) {
  const isEdit = !!campaign;
  const [form, setForm] = useState({
    name:        campaign?.name || "",
    description: campaign?.description || "",
    startDate:   toInputDate(campaign?.startDate),
    endDate:     toInputDate(campaign?.endDate),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.endDate < form.startDate) {
      setError("A data final deve ser depois da data inicial");
      return;
    }
    setLoading(true);
    const payload = {
      name:        form.name,
      description: form.description || "",
      startDate:   form.startDate,
      endDate:     form.endDate,
    };
    try {
      const saved = isEdit
        ? await campaignsApi.update(campaign.id, payload)
        : await campaignsApi.create(clientId, payload);
      onSave(saved);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao salvar campanha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 460, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, padding: 6, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, display: "flex" }}>
          <X size={15} />
        </button>

        <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: C.text }}>
          {isEdit ? "Editar Campanha" : "Nova Campanha"}
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
          Depois de salvar, você seleciona quais páginas do site e publicações já existentes fazem parte desta campanha.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Nome da campanha *</label>
            <input required style={inputStyle} placeholder="Ex: Campanha Dia das Mães 2026" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Descrição (opcional)</label>
            <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Do que se trata esta campanha…" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Data inicial *</label>
              <input required type="date" style={inputStyle} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Data final *</label>
              <input required type="date" style={inputStyle} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </div>
          </div>

          {error && <p style={{ margin: 0, fontSize: 12, color: "#EF4444", padding: "7px 12px", background: "#EF444415", borderRadius: 8 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: "10px", borderRadius: 9, border: "none", background: loading ? C.border : `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
              {loading ? "Salvando…" : isEdit ? "Salvar Alterações" : "Criar e Selecionar Conteúdos"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
