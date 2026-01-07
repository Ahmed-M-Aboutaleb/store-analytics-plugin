import { useEffect } from "react";
import { useDashboardData } from "../../../providers/dashboard-data-context";

const ProductTab = () => {
  const { refetch, data } = useDashboardData();
  useEffect(() => {
    refetch("/admin/dashboard/products");
  }, [refetch]);
  return <div>{data?.products?.totalInventory}</div>;
};

export default ProductTab;
