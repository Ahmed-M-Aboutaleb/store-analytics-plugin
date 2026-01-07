import { useDashboardData } from "../../../providers/dashboard-data-context";
import MetricCard from "../components/metric-card";

const OrdersTab = () => {
  const { data } = useDashboardData();
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-center items-center">
        {data?.orders?.kpis && (
          <>
            <MetricCard
              value={data.orders.kpis.totalOrders}
              label="Total Orders"
            />
            <MetricCard
              value={data.orders.kpis.totalSales}
              label="Total Sales"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersTab;
