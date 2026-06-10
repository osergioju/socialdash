import React from "react";
import { Link } from "react-router-dom";
import { C } from "../utils/colors";

const sectionTitle = { margin: "28px 0 10px", fontSize: 16, fontWeight: 700, color: C.text };
const paragraph    = { margin: "0 0 12px", fontSize: 14, lineHeight: 1.7, color: C.textMuted };
const listItem     = { fontSize: 14, lineHeight: 1.7, color: C.textMuted, marginBottom: 6 };

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: "#fff", margin: "0 auto 16px", letterSpacing: "-0.03em" }}>
            CRT
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: C.text, letterSpacing: "-0.03em" }}>Política de Privacidade</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.textMuted }}>CRT Ecosystem — Plataforma de gestão de mídias sociais</p>
        </div>

        {/* Card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "32px 36px" }}>
          <p style={{ ...paragraph, fontSize: 12, color: C.textDim }}>Última atualização: 10 de junho de 2026</p>

          <p style={paragraph}>
            Esta Política de Privacidade descreve como o <strong style={{ color: C.text }}>CRT Ecosystem</strong>, plataforma
            operada pela CRT Comunicação, coleta, utiliza, armazena e protege os dados pessoais e as informações de
            contas conectadas dos seus usuários, em conformidade com a Lei Geral de Proteção de Dados
            (Lei nº 13.709/2018 — LGPD).
          </p>

          <h2 style={sectionTitle}>1. Dados que coletamos</h2>
          <ul style={{ margin: "0 0 12px", paddingLeft: 20 }}>
            <li style={listItem}><strong style={{ color: C.text }}>Dados de cadastro e acesso:</strong> nome, e-mail e credenciais de login (senhas são armazenadas de forma criptografada).</li>
            <li style={listItem}><strong style={{ color: C.text }}>Dados de contas conectadas:</strong> mediante sua autorização explícita, acessamos métricas e conteúdos públicos de contas profissionais conectadas via APIs oficiais — Instagram/Meta (Graph API), LinkedIn (Marketing/Community Management APIs) e Google Analytics 4.</li>
            <li style={listItem}><strong style={{ color: C.text }}>Tokens de acesso:</strong> tokens OAuth concedidos pelas plataformas conectadas, armazenados de forma segura e utilizados exclusivamente para coletar as métricas autorizadas.</li>
            <li style={listItem}><strong style={{ color: C.text }}>Dados de uso:</strong> registros técnicos de acesso à plataforma (logs), para fins de segurança e auditoria.</li>
          </ul>

          <h2 style={sectionTitle}>2. Como utilizamos os dados</h2>
          <p style={paragraph}>Os dados coletados são utilizados exclusivamente para:</p>
          <ul style={{ margin: "0 0 12px", paddingLeft: 20 }}>
            <li style={listItem}>Exibir dashboards e relatórios de desempenho de mídias sociais e analytics aos usuários autorizados;</li>
            <li style={listItem}>Autenticar usuários e proteger o acesso à plataforma;</li>
            <li style={listItem}>Manter o histórico de métricas para análise de evolução ao longo do tempo.</li>
          </ul>
          <p style={paragraph}>
            Não vendemos, alugamos ou compartilhamos dados pessoais ou dados de contas conectadas com terceiros para
            fins publicitários ou comerciais.
          </p>

          <h2 style={sectionTitle}>3. Compartilhamento de dados</h2>
          <p style={paragraph}>
            Os dados são compartilhados apenas: (a) entre a agência e seus respectivos clientes, dentro do escopo de
            acesso de cada conta; (b) com provedores de infraestrutura estritamente necessários à operação da
            plataforma (hospedagem e banco de dados); e (c) quando exigido por lei ou ordem judicial.
          </p>

          <h2 style={sectionTitle}>4. Dados de plataformas de terceiros</h2>
          <p style={paragraph}>
            O uso de dados obtidos das APIs da Meta (Instagram), do LinkedIn e do Google está sujeito também às
            políticas dessas plataformas. Coletamos apenas os dados estritamente necessários às finalidades descritas
            nesta política, dentro das permissões concedidas por você no momento da conexão. Você pode revogar o
            acesso a qualquer momento, desconectando a conta na plataforma ou diretamente nas configurações do
            serviço de origem.
          </p>

          <h2 style={sectionTitle}>5. Armazenamento e segurança</h2>
          <p style={paragraph}>
            Adotamos medidas técnicas e organizacionais adequadas para proteger os dados, incluindo criptografia de
            senhas, comunicação via HTTPS, controle de acesso por perfil e armazenamento seguro de tokens. Os dados
            são mantidos apenas pelo tempo necessário às finalidades descritas ou conforme exigências legais.
          </p>

          <h2 style={sectionTitle}>6. Exclusão de dados</h2>
          <p style={paragraph}>
            Você pode solicitar a exclusão dos seus dados pessoais e dos dados de contas conectadas a qualquer
            momento pelo e-mail indicado abaixo. Ao desconectar uma conta de rede social, os tokens de acesso
            correspondentes são invalidados.
          </p>

          <h2 style={sectionTitle}>7. Seus direitos (LGPD)</h2>
          <p style={paragraph}>
            Nos termos da LGPD, você pode solicitar: confirmação da existência de tratamento, acesso aos dados,
            correção de dados incompletos ou desatualizados, anonimização, portabilidade, eliminação e informações
            sobre compartilhamento. Para exercer seus direitos, entre em contato pelo canal abaixo.
          </p>

          <h2 style={sectionTitle}>8. Contato</h2>
          <p style={paragraph}>
            Dúvidas ou solicitações sobre esta política e o tratamento de dados podem ser encaminhadas para{" "}
            <a href="mailto:junior@crtcomunicacao.com.br" style={{ color: C.primaryLight, textDecoration: "none" }}>
              junior@crtcomunicacao.com.br
            </a>.
          </p>

          <h2 style={sectionTitle}>9. Alterações nesta política</h2>
          <p style={paragraph}>
            Esta política pode ser atualizada periodicamente. A versão vigente estará sempre disponível nesta página,
            com a data da última atualização indicada no topo.
          </p>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link to="/login" style={{ fontSize: 13, color: C.textMuted, textDecoration: "none" }}>
            ← Voltar para o login
          </Link>
        </div>

      </div>
    </div>
  );
}
