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

const STATUS_OPTIONS = [
  { value: "PLANNING", label: "Planejamento" },
  { value: "ACTIVE",   label: "Ativa" },
  { value: "ENDED",    label: "Encerrada" },
];

const CHANNEL_OPTIONS = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "LINKEDIN",  label: "LinkedIn" },
  { value: "WEBSITE",   label: "Website" },
];

const COLOR_OPTIONS = ["#0D9488", "#E1306C", "#0A66C2", "#F59E0B", "#8B5CF6", "#EF4444", "#10B981", "#06B6D4"];

function toInputDate(d) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export default function CampaignFormModal({ clientId, campaign, onClose, onSave }) {
  const isEdit = !!campaign;
  const [form, setForm] = useState({
    name:        campaign?.name || "",
    description: campaign?.description || "",
    startDate:   toInputDate(campaign?.startDate),
    endDate:     toInputDate(campaign?.endDate),
    status:      campaign?.status || "PLANNING",
    color:       campaign?.color || COLOR_OPTIONS[0],
    imageUrl:    campaign?.imageUrl || "",
    objective:   campaign?.objective || "",
    tags:        (campaign?.tags || []).join(", "),
    responsible: campaign?.responsible || "",
    notes:       campaign?.notes || "",
    channels:    campaign?.channels?.map((c) => c.channel ?? c) || [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function toggleChannel(channel) {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(channel)
        ? f.channels.filter((c) => c !== channel)
        : [...f.channels, channel],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const payload = {
      name:        form.name,
      description: form.description || "",
      startDate:   form.startDate,
      endDate:     form.endDate,
      status:      form.status,
      color:       form.color,
      imageUrl:    form.imageUrl || "",
      objective:   form.objective || "",
      tags:        form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      responsible: form.responsible || "",
      notes:       form.notes || "",
      channels:    form.channels,
    };
    try {
      if (isEdit) await campaignsApi.update(campaign.id, payload);
      else        await campaignsApi.create(clientId, payload);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao salvar campanha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20, overflowY: "auto" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, position: "relative", maxHeight: "92vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, padding: 6, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, display: "flex" }}>
          <X size={15} />
        </button>

        <h2 style={{ margin: "0 0 22px", fontSize: 17, fontWeight: 700, color: C.text }}>
          {isEdit ? "Editar Campanha" : "Nova Campanha"}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Nome *</label>
            <input required style={inputStyle} placeholder="Ex: Black Friday 2026" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Descrição da campanha…" value={form.description} onChange={(e) => set("description", e.target.value)} />
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Responsável</label>
              <input style={inputStyle} placeholder="Nome do responsável" value={form.responsible} onChange={(e) => set("responsible", e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Cor da campanha</label>
            <div style={{ display: "flex", gap: 8 }}>
              {COLOR_OPTIONS.map((color) => (
                <button key={color} type="button" onClick={() => set("color", color)} style={{
                  width: 26, height: 26, borderRadius: 8, background: color, cursor: "pointer",
                  border: form.color === color ? `2px solid ${C.text}` : "2px solid transparent",
                  outline: form.color === color ? `1px solid ${color}` : "none",
                }} />
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Canais da campanha</label>
            <div style={{ display: "flex", gap: 8 }}>
              {CHANNEL_OPTIONS.map((ch) => {
                const active = form.channels.includes(ch.value);
                return (
                  <button key={ch.value} type="button" onClick={() => toggleChannel(ch.value)} style={{
                    flex: 1, padding: "9px 10px", borderRadius: 9, cursor: "pointer",
                    fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                    border: `1px solid ${active ? C.primary : C.border}`,
                    background: active ? C.primary + "22" : "transparent",
                    color: active ? C.primaryLight : C.textMuted,
                  }}>
                    {active ? "☑" : "☐"} {ch.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Objetivo</label>
            <input style={inputStyle} placeholder="Ex: Aumentar vendas do produto X" value={form.objective} onChange={(e) => set("objective", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Tags (separadas por vírgula)</label>
              <input style={inputStyle} placeholder="promoção, sazonal" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Imagem (URL, opcional)</label>
              <input style={inputStyle} type="url" placeholder="https://…" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Observações</label>
            <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Notas internas…" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>

          {error && <p style={{ margin: 0, fontSize: 12, color: "#EF4444", padding: "7px 12px", background: "#EF444415", borderRadius: 8 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: "10px", borderRadius: 9, border: "none", background: loading ? C.border : `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
              {loading ? "Salvando…" : isEdit ? "Salvar Alterações" : "Criar Campanha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
