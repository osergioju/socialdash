import { useState, useEffect, useCallback } from "react";
import { listeningApi } from "../services/api";

export function useMonitorings(clientId) {
  const [monitorings, setMonitorings] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const load = useCallback(() => {
    if (!clientId) { setMonitorings([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    listeningApi.list(clientId)
      .then(setMonitorings)
      .catch((e) => setError(e.response?.data?.error || "Erro ao carregar monitoramentos"))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  return { monitorings, loading, error, reload: load };
}

export function useListeningDashboard(id, days = 30) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    listeningApi.dashboard(id, days)
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || "Erro ao carregar dashboard"))
      .finally(() => setLoading(false));
  }, [id, days]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

export function useMentions(id, filters) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    listeningApi.mentions(id, filters)
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || "Erro ao carregar menções"))
      .finally(() => setLoading(false));
  }, [id, JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

export function useListeningSummary(id, period = "weekly") {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [generating, setGenerating] = useState(false);

  const load = useCallback((force = false) => {
    if (!id) return;
    if (force) setGenerating(true);
    else setLoading(true);
    setError(null);
    listeningApi.summary(id, period, force || undefined)
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || "Erro ao gerar resumo"))
      .finally(() => { setLoading(false); setGenerating(false); });
  }, [id, period]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, generating, regenerate: () => load(true) };
}
