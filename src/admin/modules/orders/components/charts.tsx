import { Heading, Skeleton, Text } from "@medusajs/ui";
import { useDashboardData } from "../../../providers/dashboard-data-context";
import { LineChart } from "../../dashboard/components/line-chart";
import { useDashboardFilters } from "../../../providers/dashboard-filter-context";
import { StackedBarChart } from "../../dashboard/components/stacked-bar-chart";
import { useMemo } from "react";
import { transformSalesForChart } from "../../../../utils/charts";

const OrderCharts = () => {
  const { filters } = useDashboardFilters();
  const { isLoading, data } = useDashboardData();
  const rawSalesData = useMemo(
    () => data?.orders?.series?.sales || {},
    [data?.orders?.series?.sales]
  );
  const chartData = useMemo(() => {
    return transformSalesForChart(rawSalesData);
  }, [rawSalesData]);
  const currencyKeys = useMemo(() => Object.keys(rawSalesData), [rawSalesData]);
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
                  Sales Over Time
                </Heading>
                {currencyKeys.length ? (
                  <div className="w-full" style={{ aspectRatio: "16/9" }}>
                    <StackedBarChart
                      data={chartData}
                      xAxisDataKey="date"
                      dataKeys={currencyKeys}
                      yAxisTickFormatter={(val) => `${val}`}
                      useStableColors={true}
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
