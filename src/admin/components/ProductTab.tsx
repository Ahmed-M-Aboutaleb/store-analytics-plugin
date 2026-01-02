import { useCallback, useMemo } from "react";
import { Badge, Divider, Heading, Text } from "@medusajs/ui";
import { InformationCircle } from "@medusajs/icons";
import Surface from "./Surface";
import { LineChart } from "./LineChart";
import { useAnalyticsDate } from "../providers/analytics-date-provider";
import { useGlobalAnalyticsData } from "../providers/data-provider";
import { ProductsResponse } from "../types";
import TopVariantsTable from "./TopVariantsTable";
import { createIntegerFormatter } from "../../utils";

const ProductsTab = () => {
  const { preset, range } = useAnalyticsDate();
  const { productsData: data, loading, error } = useGlobalAnalyticsData();

  const shortDate = (value: string | number) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(d);
  };

  const numberFormatter = useMemo(() => createIntegerFormatter(), []);

  const clampSeriesToRange = useCallback(
    (series: ProductsResponse["series"][keyof ProductsResponse["series"]]) => {
      if (!series) return [];
      const from = range.from ? new Date(range.from) : null;
      const to = range.to ? new Date(range.to) : null;

      return series.filter(({ date }) => {
        const current = new Date(date);
        if (Number.isNaN(current.getTime())) return false;
        if (from && current < from) return false;
        if (to && current > to) return false;
        return true;
      });
    },
    [range.from, range.to]
  );

  const newCustomersSeries = useMemo(
    () => clampSeriesToRange(data?.series.new_customers ?? []),
    [clampSeriesToRange, data?.series.new_customers]
  );

  const CUSTOMER_CHART_COLOR = "#8b5cf6"; // violet

  return (
    <div className="space-y-4">
      <Surface>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Heading level="h3">Products & Customers</Heading>
            {loading && <Badge color="blue">Loading</Badge>}
            {error && <Badge color="red">Error</Badge>}
          </div>
          <Text size="small" className="text-ui-fg-subtle">
            Preset: {preset}
          </Text>
        </div>
      </Surface>

      {/* Error section */}
      {error && (
        <Surface>
          <div className="flex items-center gap-2 text-ui-fg-error">
            <InformationCircle className="h-4 w-4" />
            <Text>{error}</Text>
          </div>
        </Surface>
      )}

      {/* Warnings section */}
      {data?.warnings?.length ? (
        <Surface>
          <div className="flex items-start gap-2 text-ui-fg-warning">
            <InformationCircle className="h-4 w-4 mt-0.5" />
            <div>
              <Heading level="h3">Warnings</Heading>
              <ul className="list-disc pl-5 text-sm text-ui-fg-subtle">
                {data.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </Surface>
      ) : null}

      {/* Top variants table */}
      <div className="flex flex-col md:flex-row gap-4">
        <Surface className="w-full">
          <Heading level="h3" className="mb-2">
            Top Performing Variants
          </Heading>
          <Divider className="my-3" />
          <TopVariantsTable />
        </Surface>

        {/* New customers chart */}
        <Surface className="w-full md:mt-0">
          <div className="text-center">
            <Heading level="h3" className="mb-2">
              New Customers Over Time
            </Heading>
            {newCustomersSeries.length ? (
              <div className="w-full" style={{ aspectRatio: "16/9" }}>
                <LineChart
                  data={newCustomersSeries}
                  xAxisDataKey="date"
                  yAxisDataKey="value"
                  lineColor={CUSTOMER_CHART_COLOR}
                  xAxisTickFormatter={shortDate}
                  yAxisTickFormatter={(value) => numberFormatter.format(value)}
                  tooltipLabelFormatter={shortDate}
                  yAxisDomain={["dataMin", "dataMax"]}
                />
              </div>
            ) : (
              <div className="py-12 flex justify-center items-center">
                <Text className="text-ui-fg-muted">No data</Text>
              </div>
            )}
          </div>
        </Surface>
      </div>
    </div>
  );
};

export default ProductsTab;
