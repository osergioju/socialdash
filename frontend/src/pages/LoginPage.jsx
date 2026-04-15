import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { C } from "../utils/colors";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/clients");
    } catch (err) {
      setError(err.response?.data?.error || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: `1px solid ${C.border}`, background: C.cardHover,
    color: C.text, fontSize: 14, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: "#fff", margin: "0 auto 16px", letterSpacing: "-0.03em" }}>
            CRT
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: C.text, letterSpacing: "-0.03em" }}>CRT Ecosystem</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.textMuted }}>Plataforma de gestão de mídias sociais</p>
        </div>

        {/* Card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
          <h2 style={{ margin: "0 0 22px", fontSize: 17, fontWeight: 700, color: C.text }}>Entrar na plataforma</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 6 }}>Email</label>
              <input
                type="email" required style={inputStyle} placeholder="seu@email.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 6 }}>Senha</label>
              <input
                type="password" required style={inputStyle} placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {error && (
              <p style={{ margin: 0, fontSize: 12, color: "#EF4444", padding: "8px 12px", background: "#EF444415", borderRadius: 8 }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} style={{
              marginTop: 4, padding: "12px", borderRadius: 10, border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: loading ? C.border : `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
              color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
            }}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
