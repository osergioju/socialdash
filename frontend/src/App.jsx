import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute       from "./components/PrivateRoute";
import LoginPage          from "./pages/LoginPage";
import ClientsPage        from "./pages/ClientsPage";
import ClientDetailPage   from "./pages/ClientDetailPage";
import DashboardPage      from "./pages/DashboardPage";
import OAuthCallbackPage  from "./pages/OAuthCallbackPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Público */}
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        {/* Área da agência */}
        <Route path="/" element={<Navigate to="/clients" replace />} />
        <Route path="/clients"              element={<PrivateRoute><ClientsPage /></PrivateRoute>} />
        <Route path="/clients/:id"          element={<PrivateRoute><ClientDetailPage /></PrivateRoute>} />
        <Route path="/clients/:id/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/clients" replace />} />
      </Routes>
    </AuthProvider>
  );
}
