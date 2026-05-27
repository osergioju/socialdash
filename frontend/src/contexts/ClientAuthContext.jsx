import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { clientAuthApi } from "../services/api";

const ClientAuthContext = createContext(null);

export function ClientAuthProvider({ children }) {
  const [clientUser, setClientUser] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("client_token");
    if (!token) { setLoading(false); return; }
    clientAuthApi.me()
      .then(({ clientUser: cu, client: cl }) => { setClientUser(cu); setClient(cl); })
      .catch(() => {
        localStorage.removeItem("client_token");
        localStorage.removeItem("client_slug");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password, clientSlug) => {
    const res = await clientAuthApi.login({ email, password, clientSlug });
    localStorage.setItem("client_token", res.token);
    localStorage.setItem("client_slug", res.client.slug);
    setClientUser(res.clientUser);
    setClient(res.client);
    return res;
  }, []);

  const logout = useCallback((slug) => {
    localStorage.removeItem("client_token");
    localStorage.removeItem("client_slug");
    setClientUser(null);
    setClient(null);
    window.location.href = `/c/${slug || ""}/login`;
  }, []);

  return (
    <ClientAuthContext.Provider value={{ clientUser, client, loading, login, logout, isAuthenticated: !!clientUser }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext);
  if (!ctx) throw new Error("useClientAuth must be inside ClientAuthProvider");
  return ctx;
}
