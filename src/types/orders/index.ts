import { SeriesPoint } from "../charts";

type OrdersResponse = {
  kpis: { totalOrders: number; totalSales: number };
  series: {
    orders: SeriesPoint[];
    sales: SeriesPoint[];
  };
};

export type { OrdersResponse };
