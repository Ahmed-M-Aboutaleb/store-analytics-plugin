import { useDashboardData } from "../../../providers/dashboard-data-context";
import { useEffect } from "react";
import VariantsTable from "../components/variants-table";
import Surface from "../../dashboard/components/surface";
import { Divider, Heading } from "@medusajs/ui";
import ProductMetrics from "../components/product-metrics";

const ProductTab = () => {
  const { refetch } = useDashboardData();

  useEffect(() => {
    refetch("/admin/dashboard/products");
  }, [refetch]);

  return (
    <div className="flex gap-4 flex-col">
      <ProductMetrics />

      <Surface>
        <div className="flex items-center justify-between mb-2">
          <Heading level="h3">Top Variants</Heading>
        </div>

        <Divider className="my-3" />

        <VariantsTable />
      </Surface>
    </div>
  );
};

export default ProductTab;
