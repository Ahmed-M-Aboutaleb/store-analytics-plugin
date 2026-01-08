import { Connection, OrderKPI } from "../../../types";

type InjectedDependencies = {
  __pg_connection__: Connection;
};

class OrdersAnalysisService {
  protected connection: Connection;
  constructor({ __pg_connection__ }: InjectedDependencies) {
    this.connection = __pg_connection__;
  }

  async getOrderKPIs(fromDate: string, toDate: string): Promise<OrderKPI[]> {
    const ORDERS_SUMMARY = this.connection("order_summary as os_latest")
      .select("order_id")
      .max("version as version")
      .whereNull("deleted_at")
      .groupBy("order_id");

    const rows = await this.connection({ o: "order" })
      .leftJoin(ORDERS_SUMMARY.as("os_latest"), "os_latest.order_id", "o.id")
      .leftJoin({ os: "order_summary" }, function () {
        this.on("os.order_id", "o.id")
          .andOn("os.version", "os_latest.version")
          .andOnNull("os.deleted_at");
      })
      .select("o.currency_code")
      .count("o.id as total_orders")
      .select(
        this.connection.raw(
          `SUM(COALESCE((os.totals ->> 'current_order_total')::numeric, 0)) as total_sales`
        )
      )
      // Filters
      .where("o.created_at", ">=", fromDate)
      .where("o.created_at", "<=", toDate)
      .groupBy("o.currency_code");

    return (rows || []).map((row: any) => ({
      currency_code: row.currency_code,
      total_orders: Number(row.total_orders || 0),
      total_sales: Number(row.total_sales || 0),
    }));
  }

  async getOrdersSeries(fromDate: string, toDate: string) {
    const ORDERS_SUMMARY = this.connection("order_summary as os_latest")
      .select("order_id")
      .max("version as version")
      .whereNull("deleted_at")
      .groupBy("order_id");

    const rows = await this.connection({ o: "order" })
      .leftJoin(ORDERS_SUMMARY.as("os_latest"), "os_latest.order_id", "o.id")
      .leftJoin({ os: "order_summary" }, function () {
        this.on("os.order_id", "o.id")
          .andOn("os.version", "os_latest.version")
          .andOnNull("os.deleted_at");
      })
      .select([
        this.connection.raw("date_trunc('day', o.created_at) as day"),
        "o.currency_code",
      ])
      .count("o.id as orders")
      .select(
        this.connection.raw(
          `SUM(COALESCE((os.totals ->> 'current_order_total')::numeric, 0)) as sales`
        )
      )
      .where("o.created_at", ">=", fromDate)
      .where("o.created_at", "<=", toDate)
      .groupBy("day", "o.currency_code")
      .orderBy("day", "asc");

    const salesSeries: Record<string, { date: string; value: number }[]> = {};

    const ordersMap = new Map<string, number>();

    (rows || []).forEach((row: any) => {
      const day = new Date(row.day).toISOString().split("T")[0];
      const currency = row.currency_code?.toLowerCase() || "unknown";
      const orderCount = Number(row.orders || 0);
      const salesAmount = Number(row.sales || 0);

      if (!salesSeries[currency]) {
        salesSeries[currency] = [];
      }
      salesSeries[currency].push({
        date: day,
        value: salesAmount,
      });

      const currentTotal = ordersMap.get(day) || 0;
      ordersMap.set(day, currentTotal + orderCount);
    });

    const ordersSeries = Array.from(ordersMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      orders: ordersSeries,
      sales: salesSeries,
    };
  }
}

export { OrdersAnalysisService };
