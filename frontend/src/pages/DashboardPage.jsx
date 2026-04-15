import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useClient } from "../hooks/useClients";
import { useSyncStatus } from "../hooks/useSyncStatus";
import { ClientContext } from "../contexts/ClientContext";
import OverviewTab   from "./tabs/OverviewTab";
import InstagramTab  from "./tabs/InstagramTab";
import LinkedinTab   from "./tabs/LinkedinTab";
import Ga4Tab        from "./tabs/Ga4Tab";
import TemasTab      from "./tabs/TemasTab";

const TAB_COMPONENTS = {
  overview:  OverviewTab,
  instagram: InstagramTab,
  linkedin:  LinkedinTab,
  site:      Ga4Tab,
  temas:     TemasTab,
};

export default function DashboardPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const { client } = useClient(id);
  const { syncing, error: syncError, triggerSync, lastSyncAt, fetchStatus } = useSyncStatus(id);
  const TabComponent = TAB_COMPONENTS[activeTab] ?? OverviewTab;

  // Auto-sync on first load if never synced
  useEffect(() => {
    if (!id) return;
    // fetchStatus is called inside useSyncStatus on mount;
    // we trigger sync automatically only if needed (handled in DashboardLayout via onMount)
  }, [id]);

  return (
    <ClientContext.Provider value={id}>
      <DashboardLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        clientName={client?.name}
        clientId={id}
        syncing={syncing}
        syncError={syncError}
        lastSyncAt={lastSyncAt}
        onSync={triggerSync}
      >
        <TabComponent />
      </DashboardLayout>
    </ClientContext.Provider>
  );
}
