import React, { useState } from "react";
import { X } from "lucide-react";
import { listeningApi } from "../../services/api";
import { C } from "../../utils/colors";

const inputStyle = {
  width: "100%", padding: "10px 13px", borderRadius: 9,
  border: `1px solid ${C.border}`, background: C.cardHover,
  color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 5 };

const LANGUAGES = [
  { value: "pt", label: "Português" },
  { value: "en", label: "Inglês" },
  { value: "es", label: "Espanhol" },
];

const COUNTRIES = [
  { value: "BR", label: "Brasil" },
  { value: "US", label: "Estados Unidos" },
  { value: "PT", label: "Portugal" },
  { value: "ES", label: "Espanha" },
  { value: "AR", label: "Argentina" },
];

function toInputDate(d) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

function csv(arr) { return (arr || []).join(", "); }
function parseCsv(s) { return s.split(",").map((t) => t.trim()).filter(Boolean); }

export default function MonitoringFormModal({ clientId, monitoring, onClose, onSave }) {
  const isEdit = !!monitoring;
  const [form, setForm] = useState({
    name:        monitoring?.name || "",
    brand:       monitoring?.brand || "",
    keywords:    csv(monitoring?.keywords),
    hashtags:    csv(monitoring?.hashtags),
    competitors: csv(monitoring?.competitors),
    language:    monitoring?.language || "pt",
    country:     monitoring?.country || "BR",
    startDate:   toInputDate(monitoring?.startDate) || toInputDate(new Date()),
    status:      monitoring?.status || "ACTIVE",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const payload = {
      name:        form.name,
      brand:       form.brand,
      keywords:    parseCsv(form.keywords),
      hashtags:    parseCsv(form.hashtags),
      competitors: parseCsv(form.competitors),
      language:    form.language,
      country:     form.country,
      startDate:   form.startDate,
      status:      form.status,
    };
    try {
      if (isEdit) await listeningApi.update(monitoring.id, payload);
      else        await listeningApi.create(clientId, payload);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao salvar monitoramento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20, overflowY: "auto" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 520, position: "relative", maxHeight: "92vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, padding: 6, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, display: "flex" }}>
          <X size={15} />
        </button>

        <h2 style={{ margin: "0 0 22px", fontSize: 17, fontWeight: 700, color: C.text }}>
          {isEdit ? "Editar Monitoramento" : "Novo Monitoramento"}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Nome do monitoramento *</label>
              <input required style={inputStyle} placeholder="Ex: Marca Principal" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Marca *</label>
              <input required style={inputStyle} placeholder="Ex: EnergisaPrev" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Palavras-chave (separadas por vírgula)</label>
            <input style={inputStyle} placeholder="previdência privada, aposentadoria" value={form.keywords} onChange={(e) => set("keywords", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Hashtags (separadas por vírgula)</label>
            <input style={inputStyle} placeholder="#previdencia, #aposentadoria" value={form.hashtags} onChange={(e) => set("hashtags", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Concorrentes (separados por vírgula)</label>
            <input style={inputStyle} placeholder="Concorrente A, Concorrente B" value={form.competitors} onChange={(e) => set("competitors", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Idioma</label>
              <select style={inputStyle} value={form.language} onChange={(e) => set("language", e.target.value)}>
                {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>País</label>
              <select style={inputStyle} value={form.country} onChange={(e) => set("country", e.target.value)}>
                {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Data inicial</label>
              <input type="date" style={inputStyle} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="ACTIVE">Ativo</option>
                <option value="PAUSED">Pausado</option>
              </select>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>
            Fontes monitoradas: Google News, Reddit e YouTube são habilitadas automaticamente.
            Feeds RSS de sites e blogs podem ser adicionados na tela do monitoramento.
          </p>

          {error && <p style={{ margin: 0, fontSize: 12, color: "#EF4444", padding: "7px 12px", background: "#EF444415", borderRadius: 8 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: "10px", borderRadius: 9, border: "none", background: loading ? C.border : `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
              {loading ? "Salvando…" : isEdit ? "Salvar Alterações" : "Criar Monitoramento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
