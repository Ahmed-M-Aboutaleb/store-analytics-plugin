import { useMemo } from "react";
import { Badge, Skeleton, Table } from "@medusajs/ui";
import { useDashboardData } from "../../../providers/dashboard-data-context";
import { useDashboardFilters } from "../../../providers/dashboard-filter-context";
import { formatMoney } from "../../../../utils/money";
import UnnormalizedTotals from "./unnormalized-totals";
const CountryBreakdownTable = () => {
  const { data, isLoading } = useDashboardData();
  const { filters } = useDashboardFilters();

  const countryKpis = data?.orders?.country_kpis || [];
  const isNormalized = filters.currency !== "original";

  // 1. Memoized Country Formatter
  const countryNames = useMemo(
    () => new Intl.DisplayNames(["en"], { type: "region" }),
    []
  );

  const getCountryName = (code?: string | null) => {
    if (!code) return "Unknown";
    try {
      return countryNames.of(code.toUpperCase()) || code;
    } catch {
      return code;
    }
  };

  // 2. Efficient Totals Calculation
  const { totalAmount, totalNet, perCurrencyTotals } = useMemo(() => {
    // If normalized, we just sum up everything
    if (isNormalized) {
      const amount = countryKpis.reduce((acc, k) => acc + k.amount, 0);
      const net = countryKpis.reduce((acc, k) => acc + k.net, 0);
      return { totalAmount: amount, totalNet: net, perCurrencyTotals: [] };
    }

    // If not normalized, group by currency
    const map = new Map<
      string,
      { currency: string; amount: number; net: number }
    >();

    countryKpis.forEach((k) => {
      const curr = k.currency?.toUpperCase() || "UNKNOWN";
      const existing = map.get(curr) || { currency: curr, amount: 0, net: 0 };

      existing.amount += k.amount;
      existing.net += k.net;
      map.set(curr, existing);
    });

    return {
      totalAmount: 0,
      totalNet: 0,
      perCurrencyTotals: Array.from(map.values()),
    };
  }, [countryKpis, isNormalized]);

  if (isLoading) {
    return <Skeleton className="h-48 w-full mb-4" />;
  }

  return (
    <div className="space-y-4">
      {/* Main Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Country</Table.HeaderCell>
              <Table.HeaderCell className="text-right">
                Total Revenue
              </Table.HeaderCell>
              <Table.HeaderCell className="text-right">
                Gateway Fees
              </Table.HeaderCell>
              <Table.HeaderCell className="text-right">
                Net Profit
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {countryKpis.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center py-8 text-ui-fg-subtle">
                  No sales data found for this period.
                </Table.Cell>
              </Table.Row>
            ) : (
              countryKpis.map((kpi) => (
                <Table.Row key={kpi.country_code || "unknown"}>
                  <Table.Cell className="font-medium">
                    {getCountryName(kpi.country_code)}
                    <span className="text-ui-fg-muted ml-1 font-normal text-xs">
                      ({kpi.country_code?.toUpperCase() || "-"})
                    </span>
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">
                    {formatMoney(kpi.amount, kpi.currency)}
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums text-ui-fg-muted">
                    {formatMoney(kpi.fees, kpi.currency)}
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums font-semibold">
                    {formatMoney(kpi.net, kpi.currency)}
                  </Table.Cell>
                </Table.Row>
              ))
            )}

            {/* Normalized Footer Row */}
            {isNormalized && countryKpis.length > 0 && (
              <Table.Row className="bg-ui-bg-subtle hover:bg-ui-bg-subtle">
                <Table.Cell className="font-bold">Total</Table.Cell>
                <Table.Cell className="text-right font-bold">
                  {formatMoney(totalAmount, filters.currency)}
                </Table.Cell>
                <Table.Cell />
                <Table.Cell className="text-right font-bold">
                  {formatMoney(totalNet, filters.currency)}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div>

      {!isNormalized && perCurrencyTotals.length > 0 && (
        <UnnormalizedTotals totals={perCurrencyTotals} />
      )}
    </div>
  );
};

export default CountryBreakdownTable;
