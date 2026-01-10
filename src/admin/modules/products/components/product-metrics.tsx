import { ShoppingBag, Trophy } from "@medusajs/icons";
import { useDashboardData } from "../../../providers/dashboard-data-context";
import MetricCard from "./metric-card";
import { Skeleton } from "@medusajs/ui";
import { useMemo } from "react";

const ProductMetrics = () => {
  const { data, isLoading } = useDashboardData();

  // Derived metrics
  const totalUnits = useMemo(() => {
    return (
      data?.products?.top_variants?.reduce((sum, v) => sum + v.quantity, 0) ?? 0
    );
  }, [data]);

  const totalVariants = useMemo(() => {
    return data?.products?.top_variants?.length ?? 0;
  }, [data]);

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
      {isLoading ? (
        [1, 2].map((key) => (
          <Skeleton key={key} className="w-full max-w-[250px] h-20" />
        ))
      ) : (
        <>
          <MetricCard value={totalUnits} label="Total Units Sold" />

          <MetricCard
            value={totalVariants}
            label="Total Variants"
            icon={<ShoppingBag />}
          />
        </>
      )}
    </div>
  );
};

export default ProductMetrics;
