import { useState, useEffect } from "react";
import { metricsApi } from "../services/api";

export function useMetrics(fetcher) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.response?.data?.error || "Erro ao carregar dados"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

export const useOverview   = () => useMetrics(metricsApi.overview);
export const useInstagram  = () => useMetrics(metricsApi.instagram);
export const useLinkedin   = () => useMetrics(metricsApi.linkedin);
export const useGa4        = () => useMetrics(metricsApi.ga4);
