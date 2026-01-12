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
    toDate: string
  ): Promise<TopVariant[]> {
    const results = await this.connection("order_item")
      .join("order_line_item", "order_item.item_id", "order_line_item.id")
      .select([
        "order_line_item.product_title",
        "order_line_item.product_handle",
        "order_line_item.variant_title",
        "order_line_item.thumbnail",
        this.connection.raw("SUM(order_item.quantity)::integer as quantity"),
      ])
      .where("order_item.created_at", ">=", fromDate)
      .where("order_item.created_at", "<=", toDate)
      .groupBy([
        "order_line_item.product_title",
        "order_line_item.product_handle",
        "order_line_item.variant_title",
        "order_line_item.thumbnail",
      ])
      .orderBy("quantity", "desc")
      .limit(10);
    return results;
  }
}

export { ProductsAnalysisService };
