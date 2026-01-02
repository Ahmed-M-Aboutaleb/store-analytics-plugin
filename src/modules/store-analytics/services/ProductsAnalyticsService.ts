import { PgConnectionType } from "../types";

type TopVariant = {
  variant_id: string;
  variant_title: string;
  product_title: string;
  quantity: number;
  revenue: number;
};

type InjectedDependencies = {
  __pg_connection__: PgConnectionType;
};

export class ProductsAnalyticsService {
  protected pgConnection: PgConnectionType;

  constructor({ __pg_connection__ }: InjectedDependencies) {
    this.pgConnection = __pg_connection__;
  }

  async getNewCustomersOverTime(
    from: Date,
    to: Date
  ): Promise<Map<string, number>> {
    // console.log("--- TEST: Fetching New Customers ---");
    // console.log("Range:", { from, to });

    const rows = await this.pgConnection({ c: "customer" })
      .select(this.pgConnection.raw(`date_trunc('day', c.created_at) as day`))
      .count<{ count: string }>({ count: "c.id" })
      .where("c.created_at", ">=", from)
      .andWhere("c.created_at", "<=", to)
      .groupBy("day")
      .orderBy("day", "asc");

    // console.log("--- TEST: Raw Customer Rows ---");
    // console.log(JSON.stringify(rows, null, 2)); // <--- Check if DB returns data

    const newCustomersOverTime = new Map<string, number>();

    type AggregationRow = {
      day: Date | string;
      count: string | number | null;
    };

    const typedRows = rows as unknown as AggregationRow[];

    for (const row of typedRows) {
      const day = new Date(row.day as any).toISOString().slice(0, 10);
      const count = Number(row.count ?? 0) || 0;
      newCustomersOverTime.set(day, count);
    }

    return newCustomersOverTime;
  }

  async getTopVariants(
    from: Date,
    to: Date,
    limit: number = 5
  ): Promise<TopVariant[]> {
    // console.log("--- TEST: Fetching Top Variants ---");

    const rows = await this.pgConnection({ link: "order_item" })
      .join("order as o", "link.order_id", "o.id")
      .join("order_line_item as li", "link.item_id", "li.id")
      .select([
        "li.variant_id",
        "li.title as variant_title",
        this.pgConnection.raw("SUM(link.quantity) as total_quantity"),
        this.pgConnection.raw(
          "SUM(li.unit_price * link.quantity) as total_revenue"
        ),
      ])
      .where("o.created_at", ">=", from)
      .andWhere("o.created_at", "<=", to)
      .groupBy(["li.variant_id", "li.title"])
      .orderBy("total_revenue", "DESC")
      .limit(limit);

    // console.log("--- TEST: Raw Variant Rows ---");
    // console.log(JSON.stringify(rows, null, 2));
    // console.log("--- TEST: Raw Variant Rows ---");
    // console.log(JSON.stringify(rows, null, 2)); // <--- Check columns and values

    return rows.map((row: any) => ({
      variant_id: row.variant_id,
      variant_title: row.variant_title,
      product_title: row.variant_title,
      quantity: Number(row.total_quantity || 0),
      revenue: Number(row.total_revenue || 0),
    }));
  }
}
