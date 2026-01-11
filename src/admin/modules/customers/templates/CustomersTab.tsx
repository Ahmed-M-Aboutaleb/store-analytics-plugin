import { useEffect } from "react";
import { useDashboardData } from "../../../providers/dashboard-data-context";
import NewCustomersChart from "../components/new-customers-chart";

const CustomersTab = () => {
  const { refetch } = useDashboardData();

  useEffect(() => {
    refetch("/admin/analysis/customers");
  }, [refetch]);

  return (
    <div className="flex flex-col gap-y-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NewCustomersChart />
      </div>
    </div>
  );
};

export default CustomersTab;
