import { OrderDTO } from "@medusajs/framework/types";
import { SeriesPoint } from "../charts";

type CountryKPI = {
  country_code: string | null;
  currency: string;
  amount: number;
  fees: number;
  net: number;
};

type OrdersResponse = {
  kpis: { totalOrders: number; totalSales: number };
  series: {
    orders: SeriesPoint[];
    sales: SeriesPoint[];
  };
  orders: OrderDTO[];
  country_kpis: CountryKPI[];
};

export type { OrdersResponse };
