import { Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { OrderDTO } from "@medusajs/framework/types";
import { ANALYSIS_MODULE } from "../../../modules/analysis/index";
import AnalysisModuleService from "../../../modules/analysis/service";
import { CurrencySelector } from "../../../types";

type GetOrdersWorkflowInput = {
  fromDate: string;
  toDate: string;
  currencyCode: CurrencySelector;
  limit?: number;
  offset?: number;
};

const normalizeOrdersCurrency = async (
  orders: OrderDTO[],
  currencyCode: CurrencySelector,
  analysisModuleService: AnalysisModuleService,
  container: any
) => {
  const converter = analysisModuleService.resolveCurrencyConverter(
    container,
    currencyCode
  );
  if (!converter) {
    console.warn(
      `No currency converter found for currency code: ${currencyCode}`
    );
    return;
  }

  const normalizedOrders = await Promise.all(
    orders.map(async (order) => {
      const orderDate = new Date(order.created_at);
      const metadata = order.metadata || {};
      const feesCurrency = String(
        metadata.payment_gateway_fees_currency || order.currency_code
      );

      const [convertedTotal, convertedSubtotal, convertedTax, convertedFees] =
        await Promise.all([
          converter.convert(
            Number(order.total),
            order.currency_code,
            currencyCode,
            orderDate
          ),
          converter.convert(
            Number(order.subtotal),
            order.currency_code,
            currencyCode,
            orderDate
          ),
          converter.convert(
            Number(order.tax_total),
            order.currency_code,
            currencyCode,
            orderDate
          ),
          converter.convert(
            Number(metadata.payment_gateway_fees || 0),
            feesCurrency,
            currencyCode,
            orderDate
          ),
        ]);

      return {
        ...order,
        total: convertedTotal,
        subtotal: convertedSubtotal,
        tax_total: convertedTax,
        currency_code: currencyCode,
        metadata: {
          ...metadata,
          payment_gateway_fee: convertedFees,
          payment_gateway_currency: currencyCode,
        },
      };
    })
  );

  return normalizedOrders;
};

const getOrdersStep = createStep(
  "get-orders",
  async (
    { fromDate, toDate, currencyCode, limit, offset }: GetOrdersWorkflowInput,
    { container }
  ) => {
    const orderModuleService = container.resolve(Modules.ORDER);
    const analysisModuleService: AnalysisModuleService =
      container.resolve(ANALYSIS_MODULE);
    const filters: Record<string, any> = {};

    if (fromDate || toDate) {
      filters.created_at = {};
      if (fromDate) filters.created_at.$gte = fromDate;
      if (toDate) filters.created_at.$lte = toDate;
    }

    const orders = await orderModuleService.listOrders(filters, {
      select: [
        "id",
        "display_id",
        "currency_code",
        "total",
        "created_at",
        "subtotal",
        "tax_total",
        "metadata",
        "shipping_address",
      ],
      take: limit || 200,
      skip: offset || 0,
      relations: ["shipping_address"],
    });
    if (currencyCode !== "original") {
      const normalizedOrders = await normalizeOrdersCurrency(
        orders,
        currencyCode,
        analysisModuleService,
        container
      );
      return new StepResponse(normalizedOrders, normalizedOrders);
    }
    return new StepResponse(orders, orders);
  }
);

export { getOrdersStep as getOrdersStep, GetOrdersWorkflowInput };
