import { useState, useEffect, useCallback } from "react";
import { clientApi } from "../services/clientApi";

export function useClients() {
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    clientApi.list()
      .then(setClients)
      .catch(e => setError(e.response?.data?.error || "Erro ao carregar clientes"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { clients, loading, error, reload: load };
}

export function useClient(id) {
  const [client, setClient]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    clientApi.get(id)
      .then(setClient)
      .catch(e => setError(e.response?.data?.error || "Erro ao carregar cliente"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return { client, loading, error, reload: load };
}
