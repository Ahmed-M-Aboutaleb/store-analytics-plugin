import { Table, Text } from "@medusajs/ui";
import { useDashboardData } from "../../../providers/dashboard-data-context";
import { useEffect } from "react";
import { BarChart } from "../../dashboard/components/bar-chart";
import VariantsTable from "../components/variants-table";

const ProductTab = () => {
  const { refetch } = useDashboardData();

  useEffect(() => {
    refetch("/admin/dashboard/products");
  }, [refetch]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <VariantsTable />
      </div>
    </div>
  );
};

export default ProductTab;
