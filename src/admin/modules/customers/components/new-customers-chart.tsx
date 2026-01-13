import { Heading, Skeleton, Text } from "@medusajs/ui";
import { useMemo } from "react";
import { useDashboardData } from "../../../providers/dashboard-data-context";
import { LineChart } from "../../dashboard/components/line-chart";

const NewCustomersChart = () => {
  const { isLoading, data } = useDashboardData();

  const customersData = useMemo(
    () => data?.customers?.series || [],
    [data?.customers?.series]
  );

  return (
    <div className="rounded-xl border border-gray-800 p-6 shadow-sm">
      <div className="text-center">
        <Heading level="h3" className="mb-6 text-white text-left">
          New Customers Over Time
        </Heading>

        {isLoading ? (
          <Skeleton className="w-full aspect-[16/9]" />
        ) : customersData.length > 0 ? (
          <div
            className="w-full overflow-hidden"
            style={{ aspectRatio: "16/9" }}
          >
            <LineChart
              data={customersData}
              xAxisDataKey="date"
              yAxisDataKey="count"
              lineColor="#10b981"
              xAxisTickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-CA", {
                  month: "short",
                  day: "numeric",
                })
              }
              yAxisTickFormatter={(value) => `${value}`}
              tooltipLabelFormatter={(value) =>
                new Date(value).toLocaleDateString("en-CA", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              }
              yAxisDomain={["dataMin", "auto"]}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center aspect-[16/9]">
            <Text className="text-gray-400">No customer data available</Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewCustomersChart;
