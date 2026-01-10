import { useEffect } from "react";
import OrderCharts from "../components/charts";
import Metrics from "../components/metrics";
import { useDashboardData } from "../../../providers/dashboard-data-context";
import { Divider, Heading } from "@medusajs/ui";
import OrdersTable from "../components/orders-table";
import Surface from "../../dashboard/components/surface";
import CountryBreakdownTable from "../components/country-breakdown-table";

const OrdersTab = () => {
  const { refetch } = useDashboardData();
  useEffect(() => {
    refetch("/admin/analysis/orders");
  }, [refetch]);
  return (
    <div className="flex gap-4 flex-col">
      <Metrics />
      <OrderCharts />
      <Surface>
        <Heading level="h3" className="mb-2">
          Recent Orders
        </Heading>
        <Divider className="my-3" />
        <OrdersTable />
      </Surface>
      <CountryBreakdownTable />
    </div>
  );
};

export default OrdersTab;
