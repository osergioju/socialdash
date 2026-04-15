import { useState, useCallback, useEffect } from "react";
import { syncApi } from "../services/api";

export function useSyncStatus(clientId) {
  const [status, setSyncStatus] = useState([]);
  const [syncing, setSyncing]   = useState(false);
  const [error, setError]       = useState(null);

  const fetchStatus = useCallback(() => {
    if (!clientId) return;
    syncApi.status(clientId)
      .then(setSyncStatus)
      .catch(() => {});
  }, [clientId]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const triggerSync = useCallback(async (onDone) => {
    if (!clientId || syncing) return;
    setSyncing(true);
    setError(null);
    try {
      await syncApi.trigger(clientId);
      fetchStatus();
      if (onDone) onDone();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao sincronizar");
    } finally {
      setSyncing(false);
    }
  }, [clientId, syncing, fetchStatus]);

  // Last sync = most recent lastSyncAt across all platforms
  const lastSyncAt = status.reduce((latest, s) => {
    if (!s.lastSyncAt) return latest;
    const d = new Date(s.lastSyncAt);
    return !latest || d > latest ? d : latest;
  }, null);

  return { status, syncing, error, triggerSync, lastSyncAt };
}
