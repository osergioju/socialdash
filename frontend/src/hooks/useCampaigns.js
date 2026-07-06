import { useState, useEffect, useCallback } from "react";
import { campaignsApi } from "../services/api";

export function useCampaigns(clientId) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const load = useCallback(() => {
    if (!clientId) { setCampaigns([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    campaignsApi.list(clientId)
      .then(setCampaigns)
      .catch((e) => setError(e.response?.data?.error || "Erro ao carregar campanhas"))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  return { campaigns, loading, error, reload: load };
}

export function useCampaign(id) {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    campaignsApi.get(id)
      .then(setCampaign)
      .catch((e) => setError(e.response?.data?.error || "Erro ao carregar campanha"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return { campaign, loading, error, reload: load };
}

export function useCampaignDashboard(id) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    campaignsApi.dashboard(id)
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || "Erro ao carregar dashboard"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

export function useCampaignAiInsights(id) {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [generating, setGenerating] = useState(false);

  const load = useCallback((force = false) => {
    if (!id) return;
    if (force) setGenerating(true);
    else setLoading(true);
    setError(null);
    campaignsApi.aiInsights(id, force || undefined)
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || "Erro ao gerar insights"))
      .finally(() => { setLoading(false); setGenerating(false); });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, generating, regenerate: () => load(true) };
}
