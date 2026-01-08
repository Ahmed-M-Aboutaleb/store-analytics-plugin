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
}

export { OrdersAnalysisService };
