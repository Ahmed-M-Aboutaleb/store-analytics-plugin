import { Heading, Skeleton, Text } from "@medusajs/ui";
import { useDashboardData } from "../../../providers/dashboard-data-context";
import { BarChart } from "../../dashboard/components/bar-chart";
import { LineChart } from "../../dashboard/components/line-chart";
import { useDashboardFilters } from "../../../providers/dashboard-filter-context";

const OrderCharts = () => {
  const { filters } = useDashboardFilters();
  const { isLoading, data } = useDashboardData();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {isLoading
        ? [1, 2].map((key) => (
            <Skeleton key={key} className="w-full aspect-[16/9]" />
          ))
        : data?.orders?.series && (
            <>
              <div className="text-center">
                <Heading level="h3" className="mb-2">
                  Orders Over Time
                </Heading>
                {data?.orders?.series.orders.length ? (
                  <div className="w-full" style={{ aspectRatio: "16/9" }}>
                    <LineChart
                      data={data.orders.series.orders}
                      xAxisDataKey="date"
                      yAxisDataKey="value"
                      lineColor="#2563eb"
                      xAxisTickFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-CA")
                      }
                      yAxisTickFormatter={(value) => `${value}`}
                      tooltipLabelFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-CA")
                      }
                      yAxisDomain={["dataMin", "dataMax"]}
                    />
                  </div>
                ) : (
                  <Text>No data</Text>
                )}
              </div>
              <div className="text-center">
                <Heading level="h3" className="mb-2">
                  Sales Over Time (
                  {filters.currency !== "original"
                    ? filters.currency.toUpperCase()
                    : "Select a currency to view sales"}
                  )
                </Heading>
                {filters.currency !== "original" &&
                data?.orders?.series.sales.length ? (
                  <div className="w-full" style={{ aspectRatio: "16/9" }}>
                    <BarChart
                      data={data.orders.series.sales}
                      xAxisDataKey="date"
                      yAxisDataKey="value"
                      lineColor="#16a34a"
                      yAxisTickFormatter={(value) => `${value}`}
                      useStableColors
                      colorKeyField="date"
                    />
                  </div>
                ) : (
                  <Text>No data</Text>
                )}
              </div>
            </>
          )}
    </div>
  );
};

export default OrderCharts;
