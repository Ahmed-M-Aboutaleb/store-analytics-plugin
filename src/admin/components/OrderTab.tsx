import { useCallback, useEffect, useMemo, useState } from "react";
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
import { sdk } from "../../utils/sdk";

const OrdersTab = () => {
  const preset: Preset = "this-month";
  const currency: CurrencySelector = "original";
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await sdk.client.fetch<OrdersResponse>(
        "/admin/analytics/orders",
        {
          query: { preset, currency },
        }
      );
      setData(body);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currency, preset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const latestCurrency = useMemo(
    () => data?.orders.data[0]?.currency_code ?? "USD",
    [data]
  );

  const displayCurrency = currency === "original" ? latestCurrency : currency;
  const ordersSeries = data?.series.orders ?? [];
  const salesSeries = data?.series.sales ?? [];

  const numberFormatter = useMemo(() => createIntegerFormatter(), []);

  const currencyFormatter = useMemo(
    () => createCurrencyFormatter(displayCurrency),
    [displayCurrency]
  );

  const shortDate = (value: string | number) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

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
            Preset: This month (fixed) · Currency: Original
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
          <div>
            <Heading level="h3" className="mb-2 text-center">
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
          <div>
            <Heading level="h3" className="mb-2 text-center">
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
        <Text size="small" className="text-ui-fg-subtle">
          Order table temporarily removed while context wiring is built.
        </Text>
      </Surface>
    </div>
  );
};

export default OrdersTab;
