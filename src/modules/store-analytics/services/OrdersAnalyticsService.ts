import { OrderStatus } from "@medusajs/framework/utils";
import { PgConnectionType } from "../types";

type OrdersCounts = {
  dateRangeFrom?: number;
  dateRangeTo?: number;
  dateRangeFromCompareTo?: number;
  dateRangeToCompareTo?: number;
  current: number;
  previous: number;
};

type InjectedDependencies = {
  __pg_connection__: PgConnectionType;
};

export class OrdersAnalyticsService {
  protected pgConnection: PgConnectionType;

  constructor({ __pg_connection__ }: InjectedDependencies) {
    this.pgConnection = __pg_connection__;
  }

  async getOrdersCount(
    orderStatuses: OrderStatus[],
    from?: Date,
    to?: Date,
    dateRangeFromCompareTo?: Date,
    dateRangeToCompareTo?: Date
  ): Promise<OrdersCounts> {
    let startQueryFrom: Date | undefined;
    const orderStatusesAsStrings = Object.values(orderStatuses);

    if (orderStatusesAsStrings.length) {
      if (dateRangeFromCompareTo && from && to && dateRangeToCompareTo) {
        const orders = await this.pgConnection
          .select(["id", "created_at", "updated_at", "customer_id"])
          .select(
            this.pgConnection.raw(
              `CASE
                WHEN "order".created_at < ? AND "order".created_at >= ? THEN 'previous'
                WHEN "order".created_at < ? AND "order".created_at >= ? THEN 'current'
              END AS type
            `,
              [dateRangeToCompareTo, dateRangeFromCompareTo, to, from]
            )
          )
          .from("order")
          .whereIn("status", orderStatusesAsStrings)
          .andWhere("order.created_at", ">=", dateRangeFromCompareTo)
          .groupBy(["type", "id"])
          .orderBy([{ column: "type", order: "ASC" }])
          .then((result) => result);

        const previousOrders = orders.filter(
          (order) => order.type == "previous"
        );
        const currentOrders = orders.filter((order) => order.type == "current");

        return {
          dateRangeFrom: from.getTime(),
          dateRangeTo: to.getTime(),
          dateRangeFromCompareTo: dateRangeFromCompareTo.getTime(),
          dateRangeToCompareTo: dateRangeToCompareTo.getTime(),
          current: currentOrders.length,
          previous: previousOrders.length,
        };
      }
      if (!dateRangeFromCompareTo) {
        if (from) {
          startQueryFrom = from;
        } else {
          const lastOrder = await this.pgConnection("order")
            .select("created_at")
            .whereIn("status", orderStatusesAsStrings)
            .orderBy("created_at", "ASC")
            .limit(1)
            .then((result) => result[0]);

          if (lastOrder) {
            startQueryFrom = lastOrder.created_at;
          }
        }
      } else {
        startQueryFrom = dateRangeFromCompareTo;
      }
      if (startQueryFrom) {
        const endQuery = to ? to : new Date(Date.now());
        const orders = await this.pgConnection("order")
          .select(["id", "created_at", "updated_at", "customer_id"])
          .whereIn("status", orderStatusesAsStrings)
          .andWhere("created_at", ">=", startQueryFrom)
          .andWhere("created_at", "<=", endQuery)
          .orderBy("created_at", "DESC")
          .then((result) => result);

        return {
          dateRangeFrom: startQueryFrom.getTime(),
          dateRangeTo: to ? to.getTime() : new Date(Date.now()).getTime(),
          dateRangeFromCompareTo: undefined,
          dateRangeToCompareTo: undefined,
          current: orders.length,
          previous: 0,
        };
      }
    }

    return {
      dateRangeFrom: undefined,
      dateRangeTo: undefined,
      dateRangeFromCompareTo: undefined,
      dateRangeToCompareTo: undefined,
      current: 0,
      previous: 0,
    };
  }

  async getOrdersKpis(
    from: Date,
    to: Date
  ): Promise<{
    totalOrders: number;
    totalSales: number;
    ordersOverTime: Map<string, number>;
    salesOverTime: Map<string, number>;
  }> {
    const latestSummary = this.pgConnection("order_summary as os_latest")
      .select("order_id")
      .max<{ version: number }>("version as version")
      .whereNull("deleted_at")
      .groupBy("order_id");

    const rows = await this.pgConnection({ o: "order" })
      .leftJoin(latestSummary.as("os_latest"), "os_latest.order_id", "o.id")
      .leftJoin({ os: "order_summary" }, function () {
        this.on("os.order_id", "o.id")
          .andOn("os.version", "os_latest.version")
          .andOnNull("os.deleted_at");
      })
      .select(this.pgConnection.raw(`date_trunc('day', o.created_at) as day`))
      .count<{ orders: string }>({ orders: "o.id" })
      .select(
        this.pgConnection.raw(
          `SUM(COALESCE((os.totals ->> 'current_order_total')::numeric, 0)) as sales`
        )
      )
      .where("o.created_at", ">=", from)
      .andWhere("o.created_at", "<=", to)
      .groupBy("day")
      .orderBy("day", "asc");

    let totalOrders = 0;
    let totalSales = 0;
    const ordersOverTime = new Map<string, number>();
    const salesOverTime = new Map<string, number>();

    type KpiRow = {
      day: Date | string;
      orders: string | number | null;
      sales: string | number | null;
    };

    const typedRows = rows as unknown as KpiRow[];

    for (const row of typedRows) {
      const day = new Date(row.day as any).toISOString().slice(0, 10);
      const orders = Number(row.orders ?? 0) || 0;
      const sales = Number(row.sales ?? 0) || 0;
      totalOrders += orders;
      totalSales += sales;
      ordersOverTime.set(day, orders);
      salesOverTime.set(day, sales);
    }

    return { totalOrders, totalSales, ordersOverTime, salesOverTime };
  }

  async getCountryTotals(
    from: Date,
    to: Date,
    allowedStatuses: string[]
  ): Promise<
    Array<{
      country_code: string | null;
      currency_code: string | null;
      amount: number;
      fees: number;
    }>
  > {
    const latestSummary = this.pgConnection("order_summary as os_latest")
      .select("order_id")
      .max<{ version: number }>("version as version")
      .whereNull("deleted_at")
      .groupBy("order_id");

    const rows = await this.pgConnection({ o: "order" })
      .leftJoin(latestSummary.as("os_latest"), "os_latest.order_id", "o.id")
      .leftJoin({ os: "order_summary" }, function () {
        this.on("os.order_id", "o.id")
          .andOn("os.version", "os_latest.version")
          .andOnNull("os.deleted_at");
      })
      .leftJoin({ sa: "order_address" }, "sa.id", "o.shipping_address_id")
      .leftJoin({ ba: "order_address" }, "ba.id", "o.billing_address_id")
      .select(this.pgConnection.raw("COALESCE(sa.country_code, ba.country_code) as country_code"))
      .select("o.currency_code")
      .sum({
        amount: this.pgConnection.raw(
          "COALESCE((os.totals ->> 'current_order_total')::numeric, 0)"
        ) as any,
      })
      .sum({
        fees: this.pgConnection.raw(
          "COALESCE((o.metadata ->> 'stripe_fees')::numeric, 0)"
        ) as any,
      })
      .whereBetween("o.created_at", [from, to])
      .whereIn("o.status", allowedStatuses)
      .groupByRaw("COALESCE(sa.country_code, ba.country_code), o.currency_code");

    return rows.map((row: any) => ({
      country_code: row.country_code ?? null,
      currency_code: row.currency_code ?? null,
      amount: Number(row.amount ?? 0),
      fees: Number(row.fees ?? 0),
    }));
  }
}
