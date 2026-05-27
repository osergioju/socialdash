import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider }        from "./contexts/AuthContext";
import { ClientAuthProvider }  from "./contexts/ClientAuthContext";
import PrivateRoute            from "./components/PrivateRoute";
import ClientPrivateRoute      from "./components/ClientPrivateRoute";
import LoginPage               from "./pages/LoginPage";
import ClientsPage             from "./pages/ClientsPage";
import ClientDetailPage        from "./pages/ClientDetailPage";
import DashboardPage           from "./pages/DashboardPage";
import OAuthCallbackPage       from "./pages/OAuthCallbackPage";
import ClientLoginPage         from "./pages/ClientLoginPage";
import ClientDashboardPage     from "./pages/ClientDashboardPage";

export default function App() {
  return (
    <AuthProvider>
      <ClientAuthProvider>
        <Routes>
          {/* Público — agência */}
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

          {/* Área da agência */}
          <Route path="/" element={<Navigate to="/clients" replace />} />
          <Route path="/clients"               element={<PrivateRoute><ClientsPage /></PrivateRoute>} />
          <Route path="/clients/:id"           element={<PrivateRoute><ClientDetailPage /></PrivateRoute>} />
          <Route path="/clients/:id/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

          {/* Área do cliente final */}
          <Route path="/c/:slug/login" element={<ClientLoginPage />} />
          <Route path="/c/:slug"       element={<ClientPrivateRoute><ClientDashboardPage /></ClientPrivateRoute>} />

          <Route path="*" element={<Navigate to="/clients" replace />} />
        </Routes>
      </ClientAuthProvider>
    </AuthProvider>
  );
}
