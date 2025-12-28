import { normalizeAmount } from ".";
import {
  CurrencyNormalizationService,
  CurrencySelector,
  OrdersResponse,
} from "../api/admin/analytics/orders/types";

export async function convertOrderAmounts(
  order: OrdersResponse["orders"]["data"][number],
  currency: CurrencySelector,
  converter: CurrencyNormalizationService,
  orderDate: Date
) {
  const convertedSubtotal = await normalizeAmount(
    order.subtotal,
    order.currency_code,
    currency,
    orderDate,
    converter
  );
  const convertedTax = await normalizeAmount(
    order.tax_total,
    order.currency_code,
    currency,
    orderDate,
    converter
  );
  const convertedTotal = await normalizeAmount(
    order.total,
    order.currency_code,
    currency,
    orderDate,
    converter
  );
  const convertedFees = await normalizeAmount(
    order.stripe_fees,
    order.stripe_fees_currency || order.currency_code,
    currency,
    orderDate,
    converter
  );

  return {
    ...order,
    converted: {
      currency,
      subtotal: convertedSubtotal,
      tax_total: convertedTax,
      total: convertedTotal,
      stripe_fees: convertedFees,
    },
  };
}
