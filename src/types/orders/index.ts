import { OrderDTO } from "@medusajs/framework/types";
import { SeriesPoint } from "../charts";
type OrdersResponse = {
  kpis: { totalOrders: number; totalSales: number };
  series: {
    orders: SeriesPoint[];
    sales: SeriesPoint[];
  };
  orders: OrderDTO[];
};

export type { OrdersResponse };
