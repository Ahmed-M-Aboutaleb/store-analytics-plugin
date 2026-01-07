import { BuildingTax } from "@medusajs/icons";
import { useDashboardData } from "../../../providers/dashboard-data-context";
import { useDashboardFilters } from "../../../providers/dashboard-filter-context";
import MetricCard from "./metric-card";
import { Skeleton } from "@medusajs/ui";

const Metrics = () => {
  const { filters } = useDashboardFilters();
  const { data, isLoading } = useDashboardData();
  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
      {isLoading
        ? [1, 2].map((key) => (
            <Skeleton key={key} className="w-full max-w-[250px] h-20" />
          ))
        : data?.orders?.kpis && (
            <>
              <MetricCard
                value={data.orders.kpis.totalOrders}
                label="Total Orders"
              />
              <MetricCard
                value={
                  filters.currency === "original"
                    ? "≈"
                    : data.orders.kpis.totalSales +
                      ` ${filters.currency.toUpperCase()}`
                }
                label="Total Sales"
                icon={<BuildingTax />}
              />
            </>
          )}
    </div>
  );
};

export default Metrics;
