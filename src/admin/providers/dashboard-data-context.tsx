import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDashboardFilters } from "./dashboard-filter-context";
import { OrdersResponse } from "../../types";
import { sdk } from "../../utils/sdk";
type ProductsTabData = {
  totalProducts: number;
  totalInventory: number;
};
type DashboardData = {
  orders: OrdersResponse;
  products: ProductsTabData;
};

type DashboardDataContextType = {
  isLoading: boolean;
  error: Error | null;
  data: Partial<DashboardData> | null;
  refetch: (path: string, limit?: number, offset?: number) => Promise<void>;
};

const DashboardDataContext = createContext<
  DashboardDataContextType | undefined
>(undefined);

const DashboardDataProvider = ({ children }: { children: React.ReactNode }) => {
  const { filters } = useDashboardFilters();

  const [data, setData] = useState<Partial<DashboardData> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastRequestId = useRef(0);
  const fetchData = useCallback(
    async (path: string, limit: number = 200, offset: number = 0) => {
      const requestId = Date.now();
      lastRequestId.current = requestId;
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          limit,
          offset,
          from: filters.dateRange.from.toISOString(),
          to: filters.dateRange.to.toISOString(),
          preset: filters.dateRange.preset,
          currency: filters.currency,
        };
        console.log("Refetch called with:", { path, limit, offset });
        await new Promise((resolve) => setTimeout(resolve, 600));

        const mockProductsData: ProductsTabData = {
          totalProducts: 75,
          totalInventory: 3001,
        };
        let newData: Partial<DashboardData> = {};
        if (path.includes("orders")) {
          const response = await sdk.client.fetch<OrdersResponse>(path, {
            query: params,
          });
          newData = { orders: response };
        } else {
          newData = {
            products: mockProductsData,
          };
        }
        if (lastRequestId.current === requestId) {
          setData((prevData) => ({ ...prevData, ...newData }));
        }
      } catch (err) {
        if (lastRequestId.current !== requestId) {
          return;
        }
        const myErr = err instanceof Error ? err : new Error("Unknown error");
        console.error("Error fetching dashboard data:", myErr);
        setError(myErr);
      } finally {
        if (lastRequestId.current !== requestId) {
          return;
        }
        setIsLoading(false);
      }
    },
    [filters.currency, filters.dateRange]
  );
  const value = useMemo(
    () => ({
      data,
      isLoading,
      error,
      refetch: fetchData,
    }),
    [data, isLoading, error, fetchData]
  );

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
};

const useDashboardData = () => {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error(
      "useDashboardData must be used within a DashboardDataProvider"
    );
  }
  return context;
};

export { DashboardDataProvider, useDashboardData };
