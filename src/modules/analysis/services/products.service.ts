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
    const results = await this.connection("order_line_item")
      .join("order", "order_line_item.order_id", "order.id")
      .join(
        "product_variant",
        "order_line_item.variant_id",
        "product_variant.id"
      )
      .join("product", "product_variant.product_id", "product.id")
      .select([
        "product_variant.id",
        "product_variant.sku",
        "product_variant.title as variant_title",
        "product.title as product_title",
        "product.thumbnail",
        this.connection.raw(
          "SUM(order_line_item.quantity)::integer as quantity"
        ),
      ])
      .where("order.created_at", ">=", fromDate)
      .where("order.created_at", "<=", toDate)
      .whereNull("order.canceled_at")
      .groupBy(
        "product_variant.id",
        "product_variant.sku",
        "product_variant.title",
        "product.title",
        "product.thumbnail"
      )
      .orderBy("quantity", "desc")
      .limit(10);

    return results.map((row) => ({
      id: row.id,
      title: `${row.product_title} (${row.variant_title})`,
      sku: row.sku,
      quantity: row.quantity,
      thumbnail: row.thumbnail,
      product_title: row.product_title,
      variant_title: row.variant_title,
    }));
  }
}

export { ProductsAnalysisService };
