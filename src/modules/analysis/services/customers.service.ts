import { Connection, CustomersKPI } from "../../../types";

type InjectedDependencies = {
  __pg_connection__: Connection;
};

class CustomersAnalysisService {
  protected connection: Connection;

  constructor({ __pg_connection__ }: InjectedDependencies) {
    this.connection = __pg_connection__;
  }

  async getCustomersKPIs(
    fromDate: string,
    toDate: string
  ): Promise<CustomersKPI> {
    const newCustomersResult = await this.connection
      .from(this.getFirstOrderSubquery())
      .where("first_order_at", ">=", fromDate)
      .where("first_order_at", "<=", toDate)
      .count("customer_id as count")
      .first();

    const totalCustomersResult = await this.connection("customer")
      .whereNull("deleted_at")
      .count("id as count")
      .first();

    return {
      new_count: Number(newCustomersResult?.count ?? 0),
      total_count: Number(totalCustomersResult?.count ?? 0),
    };
  }

  async getCustomersSeries(fromDate: string, toDate: string) {
    const rawRows = await this.connection
      .from(this.getFirstOrderSubquery())
      .select([
        this.connection.raw("date_trunc('day', first_order_at)::date as day"),
      ])
      .where("first_order_at", ">=", fromDate)
      .where("first_order_at", "<=", toDate)
      .count("customer_id as count")
      .groupBy("day")
      .orderBy("day", "asc");

    const rows = rawRows.map((r) => ({
      day: new Date(r.day),
      count: String(r.count ?? 0),
    }));

    return this.processSeriesData(rows);
  }

  private getFirstOrderSubquery() {
    return this.connection("order")
      .select("customer_id")
      .min("created_at as first_order_at")
      .whereNotNull("customer_id") // Exclude guest checkouts if necessary
      .groupBy("customer_id")
      .as("first_orders");
  }

  private processSeriesData(rows: { day: Date; count: string }[]) {
    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map((row) => ({
      date: row.day.toISOString().split("T")[0],
      count: Number(row.count),
    }));
  }
}

export { CustomersAnalysisService };
