import { useState, useEffect, useCallback } from "react";
import { AdminOrder } from "@medusajs/framework/types";
import { sdk } from "../../utils/sdk";
import { CurrencySelector } from "../../types";
import { useDashboardFilters } from "../providers/dashboard-filter-context";
import { resolveRange } from "../../utils/date";

export type TableOrder = {
  id: string;
  display_id: number | undefined;
  created_at: Date;
  country_code: string;
  subtotal: number;
  tax_total: number;
  total: number;
  payment_gateway_fee?: number;
  payment_gateway_currency?: string;
  currency_code: string;
};

const fetchConversionRate = async (
  amount: number,
  from: string,
  to: CurrencySelector,
  date: string
): Promise<number> => {
  try {
    const data = await sdk.client.fetch<{ result: number }>(
      `/admin/analysis/convert-currency?base=${from}&target=${to}&amount=${amount}&date=${date}`,
      { method: "GET" }
    );
    return data.result || 0;
  } catch (e) {
    console.error(`Conversion failed for ${from}->${to}`, e);
    return amount;
  }
};
export const useOrdersTableData = () => {
  const { filters } = useDashboardFilters(); // Get the global filters
  const [isLoading, setIsLoading] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);

  const [rawOrders, setRawOrders] = useState<AdminOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [tableOrders, setTableOrders] = useState<TableOrder[]>([]);

  // Pagination State
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 20;

  // 1. Fetch Raw Orders with Date Filters
  const fetchOrders = useCallback(
    async (limit: number, offset: number) => {
      setIsLoading(true);
      try {
        // Construct the query object
        const range = resolveRange(
          filters.dateRange.preset,
          filters.dateRange.from.toISOString(),
          filters.dateRange.to.toISOString()
        );
        const queryParams: Record<string, any> = {
          limit,
          offset,
          fields:
            "id,display_id,created_at,currency_code,total,subtotal,tax_total,metadata,shipping_address.country_code",
          created_at: {
            $gte: range.from.toISOString(), // Default to epoch start
            $lte: range.to.toISOString(), // Default to now
          },
          status: ["completed", "pending"],
        };

        const response = await sdk.admin.order.list(queryParams);

        setRawOrders(response.orders);
        setTotalCount(response.count);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [filters.dateRange] // Re-create function when date range changes
  );

  // 2. Reset Pagination when Filters Change
  // If user is on page 5 and changes date to "Today", we must go back to page 0
  useEffect(() => {
    setPageIndex(0);
  }, [filters.dateRange, filters.currency]);

  // 3. Normalization Logic (Mostly Unchanged)
  useEffect(() => {
    const processOrders = async () => {
      if (!rawOrders.length) {
        setTableOrders([]);
        return;
      }

      if (filters.currency === "original") {
        setTableOrders(rawOrders.map(mapToTableOrder));
        return;
      }

      setIsNormalizing(true);
      const targetCurrency = filters.currency;

      const normalized = await Promise.all(
        rawOrders.map(async (order) => {
          if (order.currency_code === targetCurrency) {
            return mapToTableOrder(order);
          }

          const date = new Date(order.created_at).toISOString();
          const from = order.currency_code;

          const [convSubtotal, convTax, convTotal, convFee] = await Promise.all(
            [
              fetchConversionRate(
                Number(order.subtotal),
                from,
                targetCurrency,
                date
              ),
              fetchConversionRate(
                Number(order.tax_total),
                from,
                targetCurrency,
                date
              ),
              fetchConversionRate(
                Number(order.total),
                from,
                targetCurrency,
                date
              ),
              fetchConversionRate(
                Number(order.metadata?.payment_gateway_fee || 0),
                (order.metadata?.payment_gateway_currency as string) || from,
                targetCurrency,
                date
              ),
            ]
          );

          return {
            ...mapToTableOrder(order),
            subtotal: convSubtotal,
            tax_total: convTax,
            total: convTotal,
            payment_gateway_fee: convFee,
            payment_gateway_currency: targetCurrency,
            currency_code: targetCurrency,
          };
        })
      );

      setTableOrders(normalized);
      setIsNormalizing(false);
    };

    processOrders();
  }, [rawOrders, filters.currency]);

  // 4. Trigger Fetch when Page or Filters change
  useEffect(() => {
    fetchOrders(pageSize, pageIndex * pageSize);
  }, [fetchOrders, pageIndex, pageSize]);

  return {
    orders: tableOrders,
    count: totalCount,
    isLoading: isLoading || isNormalizing,
    pagination: {
      pageIndex,
      pageSize,
      pageCount: Math.ceil(totalCount / pageSize),
      canNextPage: pageIndex < Math.ceil(totalCount / pageSize) - 1,
      canPreviousPage: pageIndex > 0,
      nextPage: () => setPageIndex((p) => p + 1),
      previousPage: () => setPageIndex((p) => p - 1),
    },
  };
};

const mapToTableOrder = (order: AdminOrder): TableOrder => ({
  id: order.id,
  display_id: order.display_id,
  currency_code: order.currency_code,
  country_code: order.shipping_address?.country_code?.toUpperCase() || "N/A",
  total: Number(order.total),
  subtotal: Number(order.subtotal),
  tax_total: Number(order.tax_total),
  payment_gateway_fee: order.metadata
    ? Number(order.metadata.payment_gateway_fee)
    : undefined,
  payment_gateway_currency: order.metadata
    ? (order.metadata.payment_gateway_currency as string)
    : undefined,
  created_at: new Date(order.created_at),
});
