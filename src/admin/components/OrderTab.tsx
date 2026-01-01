import { useCallback, useMemo } from "react";
import { Badge, Divider, Heading, Text } from "@medusajs/ui";
import { InformationCircle } from "@medusajs/icons";
import Surface from "./Surface";
import { LineChart } from "./LineChart";
import {
  CurrencySelector,
  OrdersResponse,
  Preset,
} from "../../api/admin/analytics/orders/types";
import { BarChart } from "./BarChart";
import { createCurrencyFormatter, createIntegerFormatter } from "../../utils";
import { useAnalyticsDate } from "../providers/analytics-date-provider";
import { useGlobalAnalyticsData } from "../providers/data-provider";
import OrdersTable from "./OrdersTable";

const OrdersTab = () => {
  const { preset, range, currency } = useAnalyticsDate();
  const { ordersData: data, loading, error } = useGlobalAnalyticsData();

  const shortDate = (value: string | number) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(d);
  };

  const formatPresetLabel = (value: Preset): string =>
    value
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const presetLabel = useMemo(() => {
    if (preset === "custom") {
      if (!range.from || !range.to) return "Custom (select range)";
      return `${shortDate(range.from)} – ${shortDate(range.to)}`;
    }
    return formatPresetLabel(preset);
  }, [preset, range.from, range.to]);

  const latestCurrency = useMemo(
    () => data?.orders.data[0]?.currency_code ?? "USD",
    [data]
  );

  const displayCurrency = currency === "original" ? latestCurrency : currency;
  const clampSeriesToRange = useCallback(
    (series: OrdersResponse["series"][keyof OrdersResponse["series"]]) => {
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

  const ordersSeries = useMemo(
    () => clampSeriesToRange(data?.series.orders ?? []),
    [clampSeriesToRange, data?.series.orders]
  );
  const salesSeries = useMemo(
    () => clampSeriesToRange(data?.series.sales ?? []),
    [clampSeriesToRange, data?.series.sales]
  );

  const numberFormatter = useMemo(() => createIntegerFormatter(), []);

  const currencyFormatter = useMemo(
    () => createCurrencyFormatter(displayCurrency),
    [displayCurrency]
  );

  return (
    <div className="space-y-4">
      <Surface>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Heading level="h3">Orders KPI</Heading>
            {loading && <Badge color="blue">Loading</Badge>}
            {error && <Badge color="red">Error</Badge>}
          </div>
          <Text size="small" className="text-ui-fg-subtle">
            Preset: {presetLabel} · Currency: {currency}
          </Text>
        </div>
      </Surface>

      {error && (
        <Surface>
          <div className="flex items-center gap-2 text-ui-fg-error">
            <InformationCircle className="h-4 w-4" />
            <Text>{error}</Text>
          </div>
        </Surface>
      )}

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

      <div className="grid gap-4 md:grid-cols-3">
        <Surface>
          <Heading level="h3">Total Orders</Heading>
          <Text size="large" weight="plus" className="text-ui-fg-base">
            {numberFormatter.format(data?.kpis.total_orders ?? 0)}
          </Text>
        </Surface>
        <Surface>
          <Heading level="h3">Total Sales</Heading>
          <Text size="large" weight="plus" className="text-ui-fg-base">
            {currencyFormatter.format(data?.kpis.total_sales ?? 0)}
          </Text>
        </Surface>
        <Surface>
          <Heading level="h3">Orders Count</Heading>
          <Text size="large" weight="plus" className="text-ui-fg-base">
            {numberFormatter.format(data?.orders.count ?? 0)}
          </Text>
        </Surface>
      </div>

      <Surface>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="text-center">
            <Heading level="h3" className="mb-2">
              Orders Over Time
            </Heading>
            {ordersSeries.length ? (
              <div className="w-full" style={{ aspectRatio: "16/9" }}>
                <LineChart
                  data={ordersSeries}
                  xAxisDataKey="date"
                  yAxisDataKey="value"
                  lineColor="#2563eb"
                  xAxisTickFormatter={shortDate}
                  yAxisTickFormatter={(value) => numberFormatter.format(value)}
                  tooltipLabelFormatter={shortDate}
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
            {salesSeries.length ? (
              <div className="w-full" style={{ aspectRatio: "16/9" }}>
                <BarChart
                  data={salesSeries}
                  xAxisDataKey="date"
                  yAxisDataKey="value"
                  lineColor="#16a34a"
                  yAxisTickFormatter={(value) =>
                    currencyFormatter.format(value)
                  }
                  useStableColors
                  colorKeyField="date"
                />
              </div>
            ) : (
              <Text>No data</Text>
            )}
          </div>
        </div>
      </Surface>

      <Surface>
        <Heading level="h3" className="mb-2">
          Recent Orders
        </Heading>
        <Divider className="my-3" />
        <OrdersTable />
      </Surface>
    </div>
  );
};

export default OrdersTab;
