import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDashboardFilters } from "./dashboard-filter-context";
import { OrdersResponse, ProductsResponse } from "../../types";

type DashboardData = {
  orders: OrdersResponse;
  products: ProductsResponse;
};

type DashboardDataContextType = {
  isLoading: boolean;
  error: Error | null;
  data: Partial<DashboardData> | null;
  refetch: () => Promise<void>;
};

const DashboardDataContext = createContext<
  DashboardDataContextType | undefined
>(undefined);

const DashboardDataProvider = ({ children }: { children: React.ReactNode }) => {
  const { filters } = useDashboardFilters();

  const [data, setData] = useState<Partial<DashboardData> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchData = useCallback(
    async (path: string, limit: number = 200, offset: number = 0) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          limit,
          offset,
          date_from: filters.dateRange.from.toISOString(),
          date_to: filters.dateRange.to.toISOString(),
          currency: filters.currency,
        };
        console.info("Fetching dashboard data with params:", params);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockOrdersData: OrdersResponse = {
          kpis: { totalOrders: 150, totalSales: 45000 },
        };
        const mockProductsData: ProductsResponse = {
          top_variants: [
            {
              variant_id: "1",
              variant_title: "kpda",
              revenue: 0.5,
              quantity: 2,
            },
            {
              variant_id: "2",
              variant_title: "kpda_spicy",
              revenue: 2.5,
              quantity: 5,
            },
          ],
        };
        let mockData: Partial<DashboardData> = {};
        if (path.includes("orders")) {
          mockData = {
            orders: mockOrdersData,
          };
        } else {
          mockData = {
            products: mockProductsData,
          };
        }
        setData(mockData);
      } catch (err) {
        const myErr = err instanceof Error ? err : new Error("Unknown error");
        console.error("Error fetching dashboard data:", myErr);
        setError(myErr);
      } finally {
        setIsLoading(false);
      }
    },
    [filters.currency, filters.dateRange]
  );

  useEffect(() => {
    fetchData("/admin/dashboard/orders");
  }, [fetchData]);

  const value = useMemo(
    () => ({
      data,
      isLoading,
      error,
      refetch: () => fetchData("/admin/dashboard/orders"),
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
