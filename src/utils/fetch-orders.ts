import {
  FindConfigOrder,
  FilterableOrderProps,
  IOrderModuleService,
} from "@medusajs/types";
import { OrdersResponse } from "../api/admin/analytics/orders/types";
import { parseStripeFeeCurrency, parseStripeFees, toNumber } from ".";

const DESC_CREATED_AT: FindConfigOrder = { created_at: "DESC" };

export async function fetchOrdersPage(
  orderService: IOrderModuleService,
  filters: FilterableOrderProps,
  limit: number,
  offset: number
): Promise<{ data: OrdersResponse["orders"]["data"]; count: number }> {
  const [orders, count] = await orderService.listAndCountOrders(filters, {
    select: [
      "id",
      "display_id",
      "created_at",
      "currency_code",
      "subtotal",
      "tax_total",
      "total",
      "metadata",
      "shipping_address.id",
      "shipping_address.country_code",
      "billing_address.id",
      "billing_address.country_code",
    ],
    relations: [
      "shipping_address",
      "billing_address",
    ],
    order: DESC_CREATED_AT,
    take: limit,
    skip: offset,
  });

  const data = orders.map((order) => {
    const stripeFees = parseStripeFees(
      order.metadata as Record<string, unknown> | null
    );
    const stripeCurrency = parseStripeFeeCurrency(
      order.metadata as Record<string, unknown> | null
    );
    const countryCode =
      order.shipping_address?.country_code ??
      order.billing_address?.country_code ??
      null;

    return {
      id: order.id,
      display_id: order.display_id ?? null,
      created_at: order.created_at,
      country_code: countryCode,
      currency_code: order.currency_code ?? null,
      subtotal: toNumber(order.subtotal),
      tax_total: toNumber(order.tax_total),
      total: toNumber(order.total),
      stripe_fees: stripeFees,
      stripe_fees_currency: stripeCurrency,
    };
  });

  return { data, count };
}
