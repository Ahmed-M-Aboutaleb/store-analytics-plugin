import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useDashboardFilters } from "./dashboard-filter-context";
import { OrdersResponse } from "../../types";
import { OrderLineItemDTO } from "@medusajs/framework/types";
const mockOrdersData: OrdersResponse = {
  kpis: { totalOrders: 150, totalSales: 45000 },
  series: {
    orders: [
      { date: "2024-01-01", value: 114 },
      { date: "2024-01-02", value: 36 },
    ],
    sales: [
      { date: "2024-01-01", value: 40500 },
      { date: "2024-01-02", value: 4500 },
    ],
  },
  orders: [
    {
      id: "order_01JSNXDH9BPJWWKVW03B9E9KW8",
      metadata: {
        payment_gateway_fee: 200,
        payment_gateway_currency: "aed",
      },
      display_id: 1001,
      version: 1,
      status: "pending",
      email: "customer@example.com",
      currency_code: "usd",
      region_id: "reg_01JSNXD6VQC1YH56E4TGC81NWX",
      customer_id: "cus_01JSNXD6VQC1YH56E4TGC81NWX",
      sales_channel_id: "sc_01JSNXD6VQC1YH56E4TGC81NWX",
      total: 5500,
      subtotal: 5000,
      tax_total: 500,
      discount_total: 0,
      discount_subtotal: 0,
      discount_tax_total: 0,
      shipping_total: 0,
      shipping_subtotal: 0,
      shipping_tax_total: 0,
      original_item_total: 5000,
      original_item_subtotal: 5000,
      original_item_tax_total: 500,
      item_total: 5000,
      item_subtotal: 5000,
      item_tax_total: 500,
      original_total: 5500,
      original_tax_total: 500,
      created_at: "2024-03-15T10:00:00.000Z",
      updated_at: "2024-03-15T10:00:00.000Z",
      items: [] as OrderLineItemDTO[],
      shipping_address: {
        id: "addr_01JSNXDH9C47KZ43WQ3TBFXZA1",
        first_name: "John",
        last_name: "Doe",
        address_1: "123 Main St",
        city: "New York",
        country_code: "us",
        postal_code: "10001",
        phone: "+15550123456",
        created_at: "2024-03-15T10:00:00.000Z",
        updated_at: "2024-03-15T10:00:00.000Z",
      },
      billing_address: {
        id: "addr_01JSNXDH9C47KZ43WQ3TBFXZA2",
        first_name: "John",
        last_name: "Doe",
        address_1: "123 Main St",
        city: "New York",
        country_code: "us",
        postal_code: "10001",
        phone: "+15550123456",
        created_at: "2024-03-15T10:00:00.000Z",
        updated_at: "2024-03-15T10:00:00.000Z",
      },
      shipping_methods: [],
      transactions: [],
      item_discount_total: "",
      original_subtotal: "",
      credit_line_total: "",
      gift_card_total: "",
      gift_card_tax_total: "",
      shipping_discount_total: "",
      original_shipping_total: "",
      original_shipping_subtotal: "",
      original_shipping_tax_total: "",
      raw_original_item_total: {
        value: "",
      },
      raw_original_item_subtotal: {
        value: "",
      },
      raw_original_item_tax_total: {
        value: "",
      },
      raw_item_total: {
        value: "",
      },
      raw_item_subtotal: {
        value: "",
      },
      raw_item_tax_total: {
        value: "",
      },
      raw_original_total: {
        value: "",
      },
      raw_original_subtotal: {
        value: "",
      },
      raw_original_tax_total: {
        value: "",
      },
      raw_total: {
        value: "",
      },
      raw_subtotal: {
        value: "",
      },
      raw_tax_total: {
        value: "",
      },
      raw_discount_total: {
        value: "",
      },
      raw_discount_tax_total: {
        value: "",
      },
      raw_credit_line_total: {
        value: "",
      },
      raw_gift_card_total: {
        value: "",
      },
      raw_gift_card_tax_total: {
        value: "",
      },
      raw_shipping_total: {
        value: "",
      },
      raw_shipping_subtotal: {
        value: "",
      },
      raw_shipping_tax_total: {
        value: "",
      },
      raw_original_shipping_total: {
        value: "",
      },
      raw_original_shipping_subtotal: {
        value: "",
      },
      raw_original_shipping_tax_total: {
        value: "",
      },
    },
  ],
};
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
  refetch: (path: string) => Promise<void>;
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
    async (
      path: string = "/admin/dashboard/orders",
      limit: number = 200,
      offset: number = 0
    ) => {
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
        await new Promise((resolve) => setTimeout(resolve, 600));

        const mockProductsData: ProductsTabData = {
          totalProducts: 75,
          totalInventory: 3001,
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
        setData((prevData) => ({ ...prevData, ...mockData }));
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
