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

export const useInstagramStories = (clientId) => useMetrics(metricsApi.instagramStories, clientId);
export const useFacebook         = (clientId) => useMetrics(metricsApi.facebook,         clientId);
export const useLinkedinPosts    = (clientId) => useMetrics(metricsApi.linkedinPosts,    clientId);
export const useGa4Detail        = (clientId) => useMetrics(metricsApi.ga4Detail,        clientId);

export function useNarrative(clientId, month) {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [generating, setGenerating] = useState(false);

  const load = useCallback((force = false) => {
    if (!clientId || !month) return;
    let cancelled = false;
    if (force) setGenerating(true);
    else setLoading(true);
    setError(null);
    metricsApi.narrative(clientId, month, force || undefined)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.response?.data?.error || "Erro ao gerar narrativa"); })
      .finally(() => { if (!cancelled) { setLoading(false); setGenerating(false); } });
    return () => { cancelled = true; };
  }, [clientId, month]);

  useEffect(() => { const cancel = load(); return cancel; }, [load]);

  return { data, loading, error, generating, regenerate: () => load(true) };
}

export function useAiInsights(clientId) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [generating, setGenerating] = useState(false);

  const load = useCallback((force = false) => {
    if (!clientId) return;
    let cancelled = false;
    if (force) setGenerating(true);
    else setLoading(true);
    setError(null);
    metricsApi.aiInsights(clientId, force || undefined)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.response?.data?.error || "Erro ao gerar insights"); })
      .finally(() => { if (!cancelled) { setLoading(false); setGenerating(false); } });
    return () => { cancelled = true; };
  }, [clientId]);

  useEffect(() => { const cancel = load(); return cancel; }, [load]);

  return { data, loading, error, generating, regenerate: () => load(true) };
}
