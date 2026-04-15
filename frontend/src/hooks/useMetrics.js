import { useState, useEffect, useCallback } from "react";
import { metricsApi } from "../services/api";

export function useMetrics(fetcher, clientId) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(() => {
    if (!clientId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher(clientId)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.response?.data?.error || "Erro ao carregar dados"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetcher, clientId]);

  useEffect(() => { const cancel = load(); return cancel; }, [load]);

  return { data, loading, error, reload: load };
}

export const useOverview  = (clientId) => useMetrics(metricsApi.overview,  clientId);
export const useInstagram = (clientId) => useMetrics(metricsApi.instagram, clientId);
export const useLinkedin  = (clientId) => useMetrics(metricsApi.linkedin,  clientId);
export const useGa4       = (clientId) => useMetrics(metricsApi.ga4,       clientId);
