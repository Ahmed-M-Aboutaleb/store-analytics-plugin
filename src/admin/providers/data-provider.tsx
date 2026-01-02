import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { OrdersResponse } from "../../api/admin/analytics/orders/types";
import { useAnalyticsDate } from "./analytics-date-provider";
import { sdk } from "../../utils/sdk";

type GlobalDataContext = {
  ordersData: OrdersResponse | null;
  loading: boolean;
  error: string | null;
  limit: number;
  offset: number;
  refreshOrdersData: (options?: {
    offset?: number;
    limit?: number;
  }) => Promise<void>;
};

const GlobalDataContext = createContext<GlobalDataContext | null>(null);

export const GlobalDataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [ordersData, setOrdersData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const requestIdRef = useRef(0);
  const limitRef = useRef(limit);
  const offsetRef = useRef(offset);
  const { preset, range, currency } = useAnalyticsDate();
  const refreshOrdersData = useCallback(
    async (options?: { offset?: number; limit?: number }) => {
      if (preset === "custom" && (!range.from || !range.to)) {
        setOrdersData(null);
        setError(null);
        setLoading(false);
        return;
      }

      const nextLimit = options?.limit ?? limitRef.current;
      const nextOffset = options?.offset ?? offsetRef.current;

      limitRef.current = nextLimit;
      offsetRef.current = nextOffset;
      setLimit(nextLimit);
      setOffset(nextOffset);

      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const query: Record<string, string> = {
          preset,
          currency,
          limit: String(nextLimit),
          offset: String(nextOffset),
          country_summary: "true",
        };
        if (preset === "custom" && range.from && range.to) {
          console.log("Logs(data-provider): range", range);
          query.from = range.from;
          query.to = range.to;
        }

        const body = await sdk.client.fetch<OrdersResponse>(
          "/admin/analytics/orders",
          {
            query,
          }
        );

        // Ignore stale responses from older in-flight requests.
        if (requestId === requestIdRef.current) {
          setOrdersData(body);
        }
      } catch (err) {
        console.error("Failed to fetch orders data:", err);
        if (requestId === requestIdRef.current) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch orders data";
          setError(message);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [currency, preset, range.from, range.to]
  );

  useEffect(() => {
    refreshOrdersData({ offset: 0 });
  }, [refreshOrdersData]);
  return (
    <GlobalDataContext.Provider
      value={{ ordersData, refreshOrdersData, loading, error, limit, offset }}
    >
      {children}
    </GlobalDataContext.Provider>
  );
};

export const useGlobalAnalyticsData = () => {
  const context = useContext(GlobalDataContext);
  if (!context) {
    throw new Error(
      "useGlobalAnalyticsData must be used within a GlobalAnalyticsDataProvider"
    );
  }
  return context;
};
