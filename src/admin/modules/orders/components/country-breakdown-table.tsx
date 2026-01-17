import { useMemo } from "react";
import { Skeleton, Table, Badge } from "@medusajs/ui";
import { useDashboardData } from "../../../providers/dashboard-data-context";
import { useDashboardFilters } from "../../../providers/dashboard-filter-context";
import { formatMoney } from "../../../../utils/money";
import UnnormalizedTotals from "./unnormalized-totals";
import { CountryKPI } from "../../../../types";

const CountryBreakdownTable = () => {
  const { data, isLoading } = useDashboardData();
  const { filters } = useDashboardFilters();

  // 2. Safe access with Type Assertion
  const countryKpis: CountryKPI[] = data?.orders?.country_kpis || [];
  const isNormalized = filters.currency !== "original";

  // 3. Memoize Intl.DisplayNames for performance
  const regionNames = useMemo(
    () => new Intl.DisplayNames(["en"], { type: "region" }),
    []
  );

  const getCountryName = (code?: string | null) => {
    if (!code) return "Unknown Region";
    try {
      return regionNames.of(code.toUpperCase()) || code;
    } catch {
      return code;
    }
  };

  // 4. Calculate Totals (Logic Split)
  const { totalAmount, totalFees, totalNet, perCurrencyTotals } =
    useMemo(() => {
      // A. Normalized View: Simple Sum
      if (isNormalized) {
        return {
          totalAmount: countryKpis.reduce((acc, k) => acc + k.amount, 0),
          totalFees: countryKpis.reduce((acc, k) => acc + k.fees, 0),
          totalNet: countryKpis.reduce((acc, k) => acc + k.net, 0),
          perCurrencyTotals: [],
        };
      }

      // B. Unnormalized View: Group by Currency
      const map = new Map<
        string,
        { currency: string; amount: number; net: number; fees: number }
      >();

      countryKpis.forEach((k) => {
        const curr = k.currency?.toUpperCase() || "original";
        const existing = map.get(curr) || {
          currency: curr,
          amount: 0,
          net: 0,
          fees: 0,
        };

        existing.amount += k.amount;
        existing.net += k.net;
        existing.fees += k.fees;
        map.set(curr, existing);
      });

      return {
        totalAmount: 0,
        totalFees: 0,
        totalNet: 0,
        perCurrencyTotals: Array.from(map.values()),
      };
    }, [countryKpis, isNormalized]);

  if (isLoading) {
    return <Skeleton className="h-48 w-full mb-4 rounded-lg" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border overflow-x-auto border-ui-border-base rounded-lg overflow-hidden bg-ui-bg-base">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Country</Table.HeaderCell>
              <Table.HeaderCell className="text-right">
                Revenue
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
              countryKpis.map((kpi) => {
                // 5. Generate a unique key for Country+Currency combo
                const uniqueKey = `${kpi.country_code}-${kpi.currency}`;

                return (
                  <Table.Row key={uniqueKey}>
                    <Table.Cell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{getCountryName(kpi.country_code)}</span>
                        <Badge size="xsmall" color="grey" className="font-mono">
                          {kpi.country_code?.toUpperCase() || "N/A"}
                        </Badge>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-right tabular-nums text-ui-fg-base">
                      {formatMoney(kpi.amount, kpi.currency!)}
                    </Table.Cell>
                    <Table.Cell className="text-right tabular-nums text-ui-fg-subtle">
                      {formatMoney(kpi.fees, kpi.currency!)}
                    </Table.Cell>
                    <Table.Cell className="text-right tabular-nums font-semibold text-ui-fg-base">
                      {formatMoney(kpi.net, kpi.currency!)}
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}

            {/* Normalized Total Row */}
            {isNormalized && countryKpis.length > 0 && (
              <Table.Row className="bg-ui-bg-subtle/50 font-semibold border-t border-ui-border-strong">
                <Table.Cell>Total</Table.Cell>
                <Table.Cell className="text-right">
                  {formatMoney(totalAmount, filters.currency)}
                </Table.Cell>
                <Table.Cell className="text-right text-ui-fg-muted">
                  {formatMoney(totalFees, filters.currency)}
                </Table.Cell>
                <Table.Cell className="text-right">
                  {formatMoney(totalNet, filters.currency)}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div>

      {/* Unnormalized Totals Cards */}
      {!isNormalized && perCurrencyTotals.length > 0 && (
        <UnnormalizedTotals totals={perCurrencyTotals} />
      )}
    </div>
  );
};

export default CountryBreakdownTable;
