import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { useClientAuth } from "../contexts/ClientAuthContext";

export default function ClientPrivateRoute({ children }) {
  const { slug } = useParams();
  const { isAuthenticated, loading, client } = useClientAuth();

  if (loading) return null;

  // Not logged in → send to the client-specific login page
  if (!isAuthenticated) return <Navigate to={`/c/${slug}/login`} replace />;

  // Logged in but token belongs to a different client
  if (client && client.slug !== slug) return <Navigate to={`/c/${slug}/login`} replace />;

  return children;
}
