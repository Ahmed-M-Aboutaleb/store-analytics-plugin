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
    const includeCountryTotals = req.query.country_summary === "true";

    const range = resolveRange(
      preset,
      req.query.from as string | undefined,
      req.query.to as string | undefined
    );
    const rangeFrom = new Date(range.from);
    const rangeTo = new Date(range.to);
    const allowedStatuses = [
      "pending",
      "completed",
      "archived",
      "requires_action",
    ];

    const filters = {
      ...buildFilters(range),
      status: allowedStatuses,
    };

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

    let countryTotals: OrdersResponse["country_totals"] | undefined;
    if (includeCountryTotals) {
      const aggregates = await storeAnalytics.getCountryTotals(
        rangeFrom,
        rangeTo,
        allowedStatuses
      );

      const originalCurrencies = new Set<string>();
      const midDate = new Date((rangeFrom.getTime() + rangeTo.getTime()) / 2);

      const rows = await Promise.all(
        aggregates.map(async (row) => {
          const baseAmount = row.amount ?? 0;
          const baseFees = row.fees ?? 0;

          if (!shouldConvert) {
            if (row.currency_code) {
              originalCurrencies.add(row.currency_code.toUpperCase());
            }
            return {
              country_code: row.country_code,
              currency_code: row.currency_code ?? null,
              amount: baseAmount,
              fees: baseFees,
              net: baseAmount - baseFees,
            };
          }

          if (!row.currency_code || !converter) {
            return {
              country_code: row.country_code,
              currency_code: row.currency_code ?? null,
              amount: baseAmount,
              fees: baseFees,
              net: baseAmount - baseFees,
            };
          }

          const convertedAmount = await converter.convert(
            baseAmount,
            row.currency_code.toUpperCase(),
            currency,
            midDate
          );
          const convertedFees = await converter.convert(
            baseFees,
            row.currency_code.toUpperCase(),
            currency,
            midDate
          );

          return {
            country_code: row.country_code,
            currency_code: row.currency_code ?? null,
            amount: convertedAmount,
            fees: convertedFees,
            net: convertedAmount - convertedFees,
          };
        })
      );

      rows.sort((a, b) => b.amount - a.amount);

      const totals = rows.reduce(
        (acc, row) => {
          acc.amount += row.amount;
          acc.fees += row.fees;
          acc.net += row.net;
          return acc;
        },
        { amount: 0, fees: 0, net: 0 }
      );

      let perCurrencyTotals: OrdersResponse["country_totals"] extends { per_currency_totals?: infer T }
        ? T
        : Array<{ currency_code: string | null; amount: number; fees: number; net: number }> | undefined;
      if (!shouldConvert && originalCurrencies.size > 1) {
        const map = new Map<string, { amount: number; fees: number; net: number }>();
        rows.forEach((row) => {
          const code = (row.currency_code ?? "UNKNOWN").toUpperCase();
          const current = map.get(code) ?? { amount: 0, fees: 0, net: 0 };
          current.amount += row.amount;
          current.fees += row.fees;
          current.net += row.net;
          map.set(code, current);
        });
        perCurrencyTotals = Array.from(map.entries()).map(([currency_code, totals]) => ({
          currency_code,
          amount: totals.amount,
          fees: totals.fees,
          net: totals.net,
        }));
      }

      countryTotals = {
        rows,
        totals,
        per_currency_totals: perCurrencyTotals,
        normalized: shouldConvert || originalCurrencies.size <= 1,
      };
    }

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
      country_totals: countryTotals,
      warnings: warnings.length ? warnings : undefined,
    };

    return res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return res.status(400).json({ message });
  }
}
