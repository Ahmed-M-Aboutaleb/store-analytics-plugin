import OrderCharts from "../components/charts";
import Metrics from "../components/metrics";

const OrdersTab = () => {
  return (
    <div className="flex gap-4 flex-col">
      <Metrics />
      <OrderCharts />
    </div>
  );
};

export default OrdersTab;
