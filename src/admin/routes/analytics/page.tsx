import { ChartBar } from "@medusajs/icons";
import { DashboardDataProvider } from "../../providers/dashboard-data-context";
import { DashboardFilterProvider } from "../../providers/dashboard-filter-context";
import DashboardTabsTemplate from "../../modules/dashboard/templates/dashboard-tabs-template";
import { defineRouteConfig } from "@medusajs/admin-sdk";

const AnalyticsPage = () => {
  return (
    <DashboardFilterProvider>
      <DashboardDataProvider>
        <DashboardTabsTemplate />
      </DashboardDataProvider>
    </DashboardFilterProvider>
  );
};

export const config = defineRouteConfig({
  label: "Analytics",
  icon: ChartBar,
  rank: 2,
});

export default AnalyticsPage;
