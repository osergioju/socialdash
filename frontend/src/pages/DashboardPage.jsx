import React, { useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useClient } from "../hooks/useClients";
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
  const { client } = useClient(id);          // busca nome do cliente
  const TabComponent = TAB_COMPONENTS[activeTab] ?? OverviewTab;

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      clientName={client?.name}
      clientId={id}
    >
      <TabComponent />
    </DashboardLayout>
  );
}
