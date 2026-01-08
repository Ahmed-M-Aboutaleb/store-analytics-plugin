import { OrderDTO } from "@medusajs/framework/types";
import { SeriesPoint } from "../charts";

type CountryKPI = {
  country_code: string | null;
  currency: string;
  amount: number;
  fees: number;
  net: number;
};

type OrderKPI = {
  currency_code: string;
  total_orders: number;
  total_sales: number;
};

type OrdersResponse = {
  kpis: OrderKPI[];
  series: {
    orders: SeriesPoint[];
    sales: SeriesPoint[];
  };
  orders: OrderDTO[];
  country_kpis: CountryKPI[];
};

export type { OrdersResponse, OrderKPI, CountryKPI };
