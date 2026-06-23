import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Instagram, Linkedin, BarChart3, LineChart, Shield, Users,
  Lock, ArrowRight, X, CheckCircle2, RefreshCw,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { C } from "../utils/colors";

// ─── Modal de login (escondido atrás de um clique) ────────────────────────────
function LoginModal({ onClose }) {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
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
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "#000000B0", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, width: "100%", maxWidth: 400, padding: "28px 28px 24px", position: "relative" }}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", cursor: "pointer", color: C.textDim, display: "flex" }}
        >
          <X size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: "#fff", letterSpacing: "-0.03em" }}>
            CRT
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>Entrar na plataforma</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>Acesso restrito a usuários autorizados</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 6 }}>Email</label>
            <input
              type="email" required autoFocus style={inputStyle} placeholder="seu@email.com"
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
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {loading ? (<><RefreshCw size={15} style={{ animation: "spin 0.8s linear infinite" }} /> Entrando...</>) : "Entrar"}
          </button>
        </form>

        <p style={{ margin: "18px 0 0", fontSize: 11, color: C.textDim, textAlign: "center", lineHeight: 1.6 }}>
          Ao entrar você concorda com a nossa{" "}
          <Link to="/privacidade" style={{ color: C.primaryLight, textDecoration: "none" }}>Política de Privacidade</Link>.
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ─── Cartão de recurso ────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, color, title, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "26px 24px" }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: `${color}1A`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Icon size={22} color={color} />
      </div>
      <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: C.text }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: C.textMuted }}>{children}</p>
    </div>
  );
}

// ─── Landing Page pública ─────────────────────────────────────────────────────
export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);

  function handleEnter() {
    if (isAuthenticated) navigate("/clients");
    else setShowLogin(true);
  }

  const enterBtn = (extra = {}) => ({
    padding: "12px 24px", borderRadius: 11, border: "none", cursor: "pointer",
    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
    color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
    display: "inline-flex", alignItems: "center", gap: 8, ...extra,
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text }}>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: `${C.bg}E6`, backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#fff", letterSpacing: "-0.03em" }}>
              CRT
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>CRT Ecosystem</span>
          </div>
          <button onClick={handleEnter} style={enterBtn({ padding: "10px 20px" })}>
            {isAuthenticated ? "Acessar painel" : "Entrar"} <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "80px 24px 64px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: `${C.primary}1A`, border: `1px solid ${C.primary}40`, fontSize: 12.5, fontWeight: 600, color: C.primaryLight, marginBottom: 24 }}>
          <BarChart3 size={14} /> Plataforma de gestão de mídias sociais
        </div>
        <h1 style={{ margin: "0 auto 20px", maxWidth: 760, fontSize: 46, lineHeight: 1.1, fontWeight: 900, letterSpacing: "-0.04em" }}>
          Todas as métricas das suas redes sociais em um só painel
        </h1>
        <p style={{ margin: "0 auto 36px", maxWidth: 620, fontSize: 17, lineHeight: 1.6, color: C.textMuted }}>
          O <strong style={{ color: C.text }}>CRT Ecosystem</strong> é a plataforma da CRT Comunicação que reúne, em um
          único lugar, as métricas de desempenho de <strong style={{ color: C.text }}>Instagram/Meta</strong>,{" "}
          <strong style={{ color: C.text }}>LinkedIn</strong> e <strong style={{ color: C.text }}>Google Analytics 4</strong>.
          Conecte as contas dos seus clientes e acompanhe dashboards claros, mês a mês, com total segurança.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={handleEnter} style={enterBtn({ padding: "14px 28px", fontSize: 15 })}>
            {isAuthenticated ? "Acessar painel" : "Entrar na plataforma"} <ArrowRight size={17} />
          </button>
          <a href="#recursos" style={{ padding: "14px 28px", borderRadius: 11, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 15, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            Saiba mais
          </a>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px 24px" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 900, textAlign: "center", letterSpacing: "-0.03em" }}>
          O que a plataforma faz
        </h2>
        <p style={{ margin: "0 auto 40px", maxWidth: 560, fontSize: 15, lineHeight: 1.6, color: C.textMuted, textAlign: "center" }}>
          Reunimos os dados das principais plataformas usando suas APIs oficiais, sempre com a sua autorização explícita.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          <FeatureCard icon={Instagram} color={C.instagram} title="Instagram & Meta">
            Seguidores, alcance, impressões, engajamento e desempenho de publicações coletados via Graph API oficial da Meta.
          </FeatureCard>
          <FeatureCard icon={Linkedin} color={C.linkedin} title="LinkedIn">
            Crescimento de seguidores, estatísticas de página e analytics de posts das suas organizações via Community Management API.
          </FeatureCard>
          <FeatureCard icon={LineChart} color={C.ga4} title="Google Analytics 4">
            Sessões, usuários, origens de tráfego e conversões do seu site, integrados diretamente da sua propriedade GA4.
          </FeatureCard>
          <FeatureCard icon={BarChart3} color={C.primaryLight} title="Dashboards mensais">
            Visão consolidada e histórico mês a mês, com gráficos claros para acompanhar a evolução de cada cliente.
          </FeatureCard>
          <FeatureCard icon={Users} color={C.accent} title="Acesso para clientes">
            Cada cliente final acessa o próprio painel, com isolamento total de dados entre contas e times da agência.
          </FeatureCard>
          <FeatureCard icon={Shield} color={C.green} title="Segurança">
            Tokens de acesso criptografados, comunicação via HTTPS e controle de acesso por perfil de usuário.
          </FeatureCard>
        </div>
      </section>

      {/* Como funciona */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 24px" }}>
        <h2 style={{ margin: "0 0 36px", fontSize: 28, fontWeight: 900, textAlign: "center", letterSpacing: "-0.03em" }}>
          Como funciona
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
          {[
            { n: "1", t: "Conecte as contas", d: "A agência conecta as contas de Instagram, LinkedIn e Google Analytics do cliente via login oficial de cada plataforma (OAuth)." },
            { n: "2", t: "Coletamos as métricas", d: "A plataforma busca automaticamente apenas as métricas autorizadas pelas APIs oficiais e monta o histórico." },
            { n: "3", t: "Acompanhe os resultados", d: "Agência e cliente visualizam dashboards claros, com a evolução mês a mês de cada rede social." },
          ].map(s => (
            <div key={s.n} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "26px 24px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#fff", marginBottom: 16 }}>
                {s.n}
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800 }}>{s.t}</h3>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: C.textMuted }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dados e privacidade */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "36px 36px", display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `${C.green}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Lock size={24} color={C.green} />
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>Seus dados, sob seu controle</h2>
            <p style={{ margin: "0 0 16px", fontSize: 14.5, lineHeight: 1.7, color: C.textMuted }}>
              Acessamos apenas os dados estritamente necessários às métricas que você autoriza, dentro das permissões
              concedidas no momento da conexão. Não vendemos nem compartilhamos dados pessoais ou de contas conectadas
              para fins publicitários. Você pode revogar o acesso e solicitar a exclusão dos dados a qualquer momento.
            </p>
            <ul style={{ margin: "0 0 20px", paddingLeft: 0, listStyle: "none", display: "grid", gap: 8 }}>
              {[
                "Tokens de acesso armazenados de forma criptografada",
                "Coleta limitada às permissões concedidas por você",
                "Conformidade com a LGPD (Lei nº 13.709/2018)",
                "Revogação e exclusão de dados a qualquer momento",
              ].map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: C.textMuted }}>
                  <CheckCircle2 size={16} color={C.green} style={{ flexShrink: 0 }} /> {item}
                </li>
              ))}
            </ul>
            <Link to="/privacidade" style={{ fontSize: 14, fontWeight: 600, color: C.primaryLight, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
              Ler a Política de Privacidade completa <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 72px", textAlign: "center" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em" }}>Pronto para começar?</h2>
        <p style={{ margin: "0 auto 28px", maxWidth: 480, fontSize: 15, color: C.textMuted, lineHeight: 1.6 }}>
          Acesse a plataforma com suas credenciais. O acesso é restrito a usuários autorizados da agência e seus clientes.
        </p>
        <button onClick={handleEnter} style={enterBtn({ padding: "14px 30px", fontSize: 15 })}>
          {isAuthenticated ? "Acessar painel" : "Entrar na plataforma"} <ArrowRight size={17} />
        </button>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: C.textDim }}>
            © {new Date().getFullYear()} CRT Comunicação · CRT Ecosystem
          </span>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <Link to="/privacidade" style={{ fontSize: 13, color: C.textMuted, textDecoration: "none" }}>Política de Privacidade</Link>
            <a href="mailto:junior@crtcomunicacao.com.br" style={{ fontSize: 13, color: C.textMuted, textDecoration: "none" }}>Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
