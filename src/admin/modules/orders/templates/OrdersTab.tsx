import { useEffect } from "react";
import OrderCharts from "../components/charts";
import Metrics from "../components/metrics";
import { useDashboardData } from "../../../providers/dashboard-data-context";

const OrdersTab = () => {
  const { refetch } = useDashboardData();
  useEffect(() => {
    refetch("/admin/dashboard/orders");
  }, [refetch]);
  return (
    <div className="flex gap-4 flex-col">
      <Metrics />
      <OrderCharts />
    </div>
  );
};

export default OrdersTab;
