import { useMemo } from "react";
import { Badge, Text } from "@medusajs/ui";
import { formatCurrency } from "../../utils/money";
import { useGlobalAnalyticsData } from "../providers/data-provider";
import { useAnalyticsDate } from "../providers/analytics-date-provider";

const CountryBreakdownTable = () => {
  const { ordersData, loading } = useGlobalAnalyticsData();
  const { currency: selectedCurrency } = useAnalyticsDate();

  const countryNames = useMemo(
    () => new Intl.DisplayNames(undefined, { type: "region" }),
    []
  );

  const displayCurrency = useMemo(() => {
    if (!ordersData) return "USD";
    if (selectedCurrency !== "original") return selectedCurrency;
    if (ordersData.currency !== "original") return ordersData.currency;
    const firstCurrency = ordersData.orders.data.find(
      (o) => o.currency_code
    )?.currency_code;
    return (firstCurrency ?? "USD").toUpperCase();
  }, [ordersData, selectedCurrency]);

  const rows = useMemo(() => {
    if (!ordersData) return [];
    if (ordersData.country_totals) {
      return ordersData.country_totals.rows.map((row) => ({
        country: row.country_code ?? "Unknown",
        currency: row.currency_code?.toUpperCase() ?? displayCurrency,
        amount: row.amount,
        fees: row.fees,
        net: row.net,
      }));
    }

    // Fallback: client-side aggregation (should be avoided when server aggregates available).
    const isConverted = ordersData.currency !== "original";
    const grouped = new Map<
      string,
      { amount: number; fees: number; net: number }
    >();
    for (const order of ordersData.orders.data) {
      const country = (order.country_code ?? "Unknown").toUpperCase();
      const amount = (isConverted ? order.converted?.total : order.total) ?? 0;
      const fees =
        (isConverted ? order.converted?.stripe_fees : order.stripe_fees) ?? 0;
      const net = amount - fees;
      const current = grouped.get(country) ?? { amount: 0, fees: 0, net: 0 };
      current.amount += amount;
      current.fees += fees;
      current.net += net;
      grouped.set(country, current);
    }

    return Array.from(grouped.entries())
      .map(([country, { amount, fees, net }]) => ({
        country,
        currency: displayCurrency,
        amount,
        fees,
        net,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [ordersData, displayCurrency]);

  const totals = useMemo(() => {
    if (ordersData?.country_totals) return ordersData.country_totals.totals;
    return rows.reduce(
      (acc, row) => {
        acc.amount += row.amount;
        acc.fees += row.fees;
        acc.net += row.net;
        return acc;
      },
      { amount: 0, fees: 0, net: 0 }
    );
  }, [ordersData?.country_totals, rows]);

  const formatCountry = (code?: string | null) => {
    if (!code) return "—";
    const upper = code.toUpperCase();
    const name = countryNames.of(upper);
    if (name && name !== upper) {
      return `${name} (${upper})`;
    }
    return upper;
  };

  const formatMoney = (
    amount: number | null | undefined,
    code?: string | null
  ) => {
    if (amount === null || amount === undefined) return "—";
    return formatCurrency(amount, code ?? displayCurrency, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const normalized =
    ordersData?.country_totals?.normalized ??
    ordersData?.currency !== "original";
  const perCurrencyTotals = ordersData?.country_totals?.per_currency_totals;

  if (!ordersData) {
    return (
      <Text size="small" className="text-ui-fg-subtle">
        No data
      </Text>
    );
  }

  return (
    <div className="space-y-2">
      {!normalized && (
        <div className="flex flex-col gap-1">
          <Badge color="orange">
            Totals are unnormalized (original currencies differ). Select a
            target currency to normalize.
          </Badge>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-left text-sm">
          <thead className="border-b border-ui-border-base bg-ui-bg-field">
            <tr>
              <th className="px-3 py-2 font-semibold">Country</th>
              <th className="px-3 py-2 font-semibold">Amount</th>
              <th className="px-3 py-2 font-semibold">Stripe Fees</th>
              <th className="px-3 py-2 font-semibold">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-ui-fg-subtle" colSpan={4}>
                  {loading ? "Loading..." : "No orders in range"}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.country}
                  className="border-b border-ui-border-base last:border-0"
                >
                  <td className="px-3 py-3">{formatCountry(row.country)}</td>
                  <td className="px-3 py-3">
                    {formatMoney(
                      row.amount,
                      selectedCurrency === "original"
                        ? row.currency
                        : displayCurrency
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {formatMoney(
                      row.fees,
                      selectedCurrency === "original"
                        ? row.currency
                        : displayCurrency
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {formatMoney(
                      row.net,
                      selectedCurrency === "original"
                        ? row.currency
                        : displayCurrency
                    )}
                  </td>
                </tr>
              ))
            )}
            {rows.length > 0 && normalized && (
              <tr className="bg-ui-bg-subtle font-semibold">
                <td className="px-3 py-3">Total</td>
                <td className="px-3 py-3">
                  {formatMoney(totals.amount, displayCurrency)}
                </td>
                <td className="px-3 py-3">
                  {formatMoney(totals.fees, displayCurrency)}
                </td>
                <td className="px-3 py-3">
                  {formatMoney(totals.net, displayCurrency)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!normalized && perCurrencyTotals && perCurrencyTotals.length > 0 && (
        <div className="mt-2 text-xs text-ui-fg-subtle">
          Totals per currency (not converted):
          {perCurrencyTotals && perCurrencyTotals.length > 0 && (
            <div className="flex flex-wrap mt-2 gap-2 text-xs text-ui-fg-subtle">
              {perCurrencyTotals.map((t) => (
                <span
                  key={t.currency_code || "UNKNOWN"}
                  className="rounded-md bg-ui-bg-field px-2 py-1"
                >
                  {t.currency_code ?? "Unknown"}:{" "}
                  {formatMoney(t.amount, t.currency_code)} net{" "}
                  {formatMoney(t.net, t.currency_code)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CountryBreakdownTable;
