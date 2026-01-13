import {
  Connection,
  CountryKPI,
  CurrencyNormalizationService,
  CurrencySelector,
  OrderKPI,
} from "../../../types";

type InjectedDependencies = {
  __pg_connection__: Connection;
};

type OrderKPIRow = {
  day: string;
  currency_code: string;
  daily_orders: string;
  daily_sales: string;
};

class OrdersAnalysisService {
  protected connection: Connection;

  constructor({ __pg_connection__ }: InjectedDependencies) {
    this.connection = __pg_connection__;
  }

  async getOrderKPIs(
    fromDate: string,
    toDate: string,
    currency: CurrencySelector,
    converter: CurrencyNormalizationService | null,
    allowedStatuses: string[] = ["completed", "pending"]
  ): Promise<OrderKPI[]> {
    const query = this.getBaseQuery(fromDate, toDate, allowedStatuses);

    const rows: OrderKPIRow[] = await query
      .select([
        this.connection.raw(
          "TO_CHAR(date_trunc('day', o.created_at), 'YYYY-MM-DD') as day"
        ),
        "o.currency_code",
      ])
      .count("o.id as daily_orders")
      .select(
        this.connection.raw(
          `SUM(COALESCE((os.totals ->> 'current_order_total')::numeric, 0)) as daily_sales`
        )
      )
      .groupBy("day", "o.currency_code");

    if (currency !== "original") {
      return await this.normalizeKPISalesCurrency(rows, currency, converter);
    }

    return this.aggregateByOriginalCurrency(rows);
  }

  async getOrdersSeries(
    fromDate: string,
    toDate: string,
    allowedStatuses: string[] = ["completed", "pending"]
  ) {
    const query = this.getBaseQuery(fromDate, toDate, allowedStatuses);

    const rawRows = await query
      .select([
        this.connection.raw(
          "TO_CHAR(date_trunc('day', o.created_at), 'YYYY-MM-DD') as day"
        ),
        "o.currency_code",
      ])
      .count("o.id as daily_orders")
      .select(
        this.connection.raw(
          `SUM(COALESCE((os.totals ->> 'current_order_total')::numeric, 0)) as daily_sales`
        )
      )
      .groupBy("day", "o.currency_code")
      .orderBy("day", "asc");

    const rows: OrderKPIRow[] = rawRows.map((r) => ({
      day: r.day.toString(),
      currency_code: String(r.currency_code),
      daily_orders: String(r.daily_orders ?? 0),
      daily_sales: String(r.daily_sales ?? 0),
    }));

    return this.processSeriesData(rows);
  }

  async getOrdersCountrySummary(
    from: string,
    to: string,
    allowedStatuses: string[] = ["completed", "pending"]
  ): Promise<CountryKPI[]> {
    const query = this.getBaseQuery(from, to, allowedStatuses);

    const rows = await query
      .leftJoin({ sa: "order_address" }, "sa.id", "o.shipping_address_id")
      .leftJoin({ ba: "order_address" }, "ba.id", "o.billing_address_id")
      .select(
        this.connection.raw(
          "COALESCE(sa.country_code, ba.country_code) as country_code"
        )
      )
      .select("o.currency_code")
      .sum({
        amount: this.connection.raw(
          "COALESCE((os.totals ->> 'current_order_total')::numeric, 0)"
        ) as any,
      })
      .sum({
        fees: this.connection.raw(
          "COALESCE((o.metadata ->> 'payment_gateway_fee')::numeric, 0)"
        ) as any,
      })
      .groupByRaw(
        "COALESCE(sa.country_code, ba.country_code), o.currency_code"
      );

    return rows.map((row: any) => ({
      country_code: row.country_code ?? null,
      currency: row.currency_code ?? null,
      amount: Number(row.amount ?? 0),
      fees: Number(row.fees ?? 0),
      net: Number(row.amount ?? 0) - Number(row.fees ?? 0),
    }));
  }

  private async normalizeKPISalesCurrency(
    rows: OrderKPIRow[],
    currency: CurrencySelector,
    converter: CurrencyNormalizationService | null
  ): Promise<OrderKPI[]> {
    let totalNormalizedSales = 0;
    let totalOrders = 0;

    await Promise.all(
      (rows || []).map(async (row) => {
        const dayDate = new Date(row.day);
        const originCurrency = row.currency_code;
        const salesAmount = Number(row.daily_sales || 0);

        totalOrders += Number(row.daily_orders || 0);

        const convertedAmount = converter
          ? await converter.convert(
              salesAmount,
              originCurrency,
              currency,
              dayDate
            )
          : salesAmount;

        totalNormalizedSales += convertedAmount;
      })
    );

    return [
      {
        currency_code: currency,
        total_orders: totalOrders,
        total_sales: totalNormalizedSales,
      },
    ];
  }

  private aggregateByOriginalCurrency(rows: OrderKPIRow[]): OrderKPI[] {
    const aggregated: Record<string, OrderKPI> = {};

    (rows || []).forEach((row) => {
      const code = row.currency_code;
      if (!aggregated[code]) {
        aggregated[code] = {
          currency_code: code,
          total_orders: 0,
          total_sales: 0,
        };
      }
      aggregated[code].total_orders += Number(row.daily_orders || 0);
      aggregated[code].total_sales += Number(row.daily_sales || 0);
    });

    return Object.values(aggregated);
  }

  private processSeriesData(rows: OrderKPIRow[]) {
    const salesSeries: Record<string, { date: string; value: number }[]> = {};
    const ordersMap = new Map<string, number>();

    (rows || []).forEach((row) => {
      const day = row.day;
      const currency = row.currency_code?.toLowerCase() || "unknown";
      const orderCount = Number(row.daily_orders || 0);
      const salesAmount = Number(row.daily_sales || 0);

      if (!salesSeries[currency]) {
        salesSeries[currency] = [];
      }
      salesSeries[currency].push({ date: day, value: salesAmount });

      const currentTotal = ordersMap.get(day) || 0;
      ordersMap.set(day, currentTotal + orderCount);
    });

    const ordersSeries = Array.from(ordersMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { orders: ordersSeries, sales: salesSeries };
  }

  private getBaseQuery(
    fromDate: string,
    toDate: string,
    allowedStatuses: string[] = ["completed", "pending"]
  ) {
    const ORDERS_SUMMARY_SUBQUERY = this.connection(
      "order_summary as os_latest"
    )
      .select("order_id")
      .max("version as version")
      .whereNull("deleted_at")
      .groupBy("order_id");

    return this.connection({ o: "order" })
      .leftJoin(
        ORDERS_SUMMARY_SUBQUERY.as("os_latest"),
        "os_latest.order_id",
        "o.id"
      )
      .leftJoin({ os: "order_summary" }, function () {
        this.on("os.order_id", "o.id")
          .andOn("os.version", "os_latest.version")
          .andOnNull("os.deleted_at");
      })
      .where("o.created_at", ">=", fromDate)
      .where("o.created_at", "<=", toDate)
      .whereIn("o.status", allowedStatuses);
  }
}

export { OrdersAnalysisService };
