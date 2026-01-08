import { BuildingTax } from "@medusajs/icons";
import { useDashboardData } from "../../../providers/dashboard-data-context";
import MetricCard from "../../dashboard/components/metric-card";
import { Skeleton } from "@medusajs/ui";
import { useMemo } from "react";
import { formatMoney } from "../../../../utils/money";

const Metrics = () => {
  const { data, isLoading } = useDashboardData();
  const KPIs = data?.orders?.kpis || [];
  const ORDERS_COUNT = useMemo(() => {
    return KPIs?.map((kpi) => kpi.total_orders).reduce((a, b) => a + b, 0) || 0;
  }, [KPIs]);
  return (
    <div className="grid grid-cols-1 justify-items-center sm:grid-cols-2 md:grid-cols-4 gap-4">
      {isLoading
        ? [1, 2].map((key) => (
            <Skeleton key={key} className="w-full max-w-[250px] h-20" />
          ))
        : data?.orders?.kpis && (
            <>
              <MetricCard value={ORDERS_COUNT} label="Total Orders" />
              {KPIs.map((kpi) => {
                return (
                  <MetricCard
                    key={kpi.currency_code}
                    value={formatMoney(kpi.total_sales, kpi.currency_code)}
                    label={`Total Sales (${kpi.currency_code.toUpperCase()})`}
                    icon={<BuildingTax />}
                  />
                );
              })}
            </>
          )}
    </div>
  );
};

export default Metrics;
