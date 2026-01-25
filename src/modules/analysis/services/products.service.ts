import { Connection, TopVariant } from "../../../types";

type InjectedDependencies = {
  __pg_connection__: Connection;
};

class ProductsAnalysisService {
  protected connection: Connection;

  constructor({ __pg_connection__ }: InjectedDependencies) {
    this.connection = __pg_connection__;
  }

  async getProductVariants(
    fromDate: string,
    toDate: string,
    allowedStatuses: string[] = ["completed", "pending"],
  ): Promise<TopVariant[]> {
    const results = await this.getBaseQuery(fromDate, toDate, allowedStatuses)
      .join({ oi: "order_item" }, function () {
        this.on("oi.order_id", "o.id").andOn("oi.version", "os_latest.version");
      })
      .join({ oli: "order_line_item" }, "oi.item_id", "oli.id")
      .select([
        "oli.product_title",
        "oli.product_handle",
        "oli.variant_title",
        "oli.thumbnail",
        this.connection.raw("SUM(oi.quantity)::integer as quantity"),
      ])
      .groupBy([
        "oli.product_title",
        "oli.product_handle",
        "oli.variant_title",
        "oli.thumbnail",
      ])
      .orderBy("quantity", "desc")
      .limit(10);
    return results;
  }

  private getBaseQuery(
    fromDate: string,
    toDate: string,
    allowedStatuses: string[] = ["completed", "pending"],
  ) {
    const ORDERS_SUMMARY_SUBQUERY = this.connection(
      "order_summary as os_latest",
    )
      .select("order_id")
      .max("version as version")
      .whereNull("deleted_at")
      .groupBy("order_id");

    return this.connection({ o: "order" })
      .leftJoin(
        ORDERS_SUMMARY_SUBQUERY.as("os_latest"),
        "os_latest.order_id",
        "o.id",
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

export { ProductsAnalysisService };
