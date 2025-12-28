import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { IOrderModuleService } from "@medusajs/types";
import { Modules } from "@medusajs/utils";
import StoreAnalyticsModuleService from "../../../../modules/store-analytics/service";
import { STORE_ANALYTICS_MODULE } from "../../../../modules/store-analytics";
import {
  ALLOWED_CURRENCIES,
  CurrencySelector,
  OrdersResponse,
  Preset,
  PRESETS,
} from "./types";
import { buildFilters, mapToSeries, resolveRange } from "../../../../utils";
import { fetchOrdersPage } from "../../../../utils/fetch-orders";
import { parseLimitOffset } from "../../../../utils/pagination";
import { resolveConverter } from "../../../../utils/converter";
import { convertOrderAmounts } from "../../../../utils/conversions";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const preset = (req.query.preset as Preset) || "this-month";
    if (!PRESETS.includes(preset)) {
      return res
        .status(400)
        .json({ message: `Invalid preset. Use one of: ${PRESETS.join(", ")}` });
    }

    const currency = (req.query.currency as CurrencySelector) || "original";
    if (!ALLOWED_CURRENCIES.includes(currency)) {
      return res.status(400).json({
        message: `Invalid currency. Use one of: ${ALLOWED_CURRENCIES.join(
          ", "
        )}`,
      });
    }

    const { limit, offset } = parseLimitOffset(
      req.query.limit,
      req.query.offset
    );

    const range = resolveRange(
      preset,
      req.query.from as string | undefined,
      req.query.to as string | undefined
    );
    const rangeFrom = new Date(range.from);
    const rangeTo = new Date(range.to);
    const filters = buildFilters(range);

    const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER);
    const storeAnalytics = req.scope.resolve<StoreAnalyticsModuleService>(
      STORE_ANALYTICS_MODULE
    );

    const warnings: string[] = [];
    const converter = resolveConverter(req.scope, currency, warnings);

    const [
      { totalOrders, totalSales, ordersOverTime, salesOverTime },
      ordersPage,
    ] = await Promise.all([
      storeAnalytics.getOrdersKpis(rangeFrom, rangeTo),
      fetchOrdersPage(orderService, filters, limit, offset),
    ]);

    const shouldConvert = currency !== "original" && converter !== null;
    const dataWithConversion = await Promise.all(
      ordersPage.data.map(async (order) => {
        if (!shouldConvert) {
          return order;
        }

        const orderDate = new Date(order.created_at);
        return convertOrderAmounts(order, currency, converter, orderDate);
      })
    );

    const response: OrdersResponse = {
      range,
      currency,
      kpis: {
        total_orders: totalOrders,
        total_sales: totalSales,
      },
      series: {
        orders: mapToSeries(ordersOverTime),
        sales: mapToSeries(salesOverTime),
      },
      orders: {
        count: ordersPage.count,
        limit,
        offset,
        data: dataWithConversion,
      },
      warnings: warnings.length ? warnings : undefined,
    };

    return res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return res.status(400).json({ message });
  }
}
