import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OrderStatus } from "@medusajs/framework/utils";
import { OrdersResponse } from "../../../../types";
import { buildFilters, mapToSeries, resolveRange } from "../../../../utils";
import { resolveConverter } from "../../../../utils/converter";
import ordersKpisWorkflow from "../../../../workflows/analytics/orders-kpis";
import ordersPageWorkflow from "../../../../workflows/analytics/orders-page";
import convertOrdersWorkflow from "../../../../workflows/analytics/convert-orders";
import countryTotalsWorkflow from "../../../../workflows/analytics/country-totals";
import { AnalyticsOrdersQuery } from "../../../validation-schemas";

const ALLOWED_STATUSES: OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.PENDING,
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = (req as unknown as { validatedQuery?: AnalyticsOrdersQuery })
      .validatedQuery;
    const {
      limit = 200,
      offset = 0,
      preset = "this-month",
      currency = "original",
      country_summary = false,
      from,
      to,
    } = query || {};

    const range = resolveRange(preset, from, to);
    const rangeFrom = new Date(range.from);
    const rangeTo = new Date(range.to);

    const filters = {
      ...buildFilters(range),
      status: ALLOWED_STATUSES,
    };

    const warnings: string[] = [];
    const converter = resolveConverter(req.scope, currency, warnings);
    const shouldConvert = currency !== "original" && converter !== null;
    const [kpisResult, ordersPageResult] = await Promise.all([
      ordersKpisWorkflow(req.scope).run({
        input: { from: rangeFrom, to: rangeTo },
      }),
      ordersPageWorkflow(req.scope).run({
        input: { filters, limit, offset },
      }),
    ]);

    const { totalOrders, totalSales, ordersOverTime, salesOverTime, rows } =
      kpisResult.result;

    const ordersPage = ordersPageResult.result;

    const { result: convertedOrders } = await convertOrdersWorkflow(
      req.scope
    ).run({ input: { orders: ordersPage.data, currency } });

    warnings.push(...convertedOrders.warnings);

    const dataWithConversion = convertedOrders.orders;

    const currencySet = new Set(
      dataWithConversion
        .map((o) => o.currency_code)
        .filter(Boolean)
        .map((c) => (c as string).toUpperCase())
    );

    let effectiveTotalSales = totalSales;
    let effectiveSalesOverTime = salesOverTime;

    if (currency === "original" && currencySet.size > 1) {
      warnings.push(
        "Mixed order currencies detected. KPIs and sales charts are hidden in original mode; select a target currency to view totals."
      );
      effectiveTotalSales = 0;
      effectiveSalesOverTime = new Map();
    }

    if (shouldConvert && converter) {
      effectiveTotalSales = 0;
      effectiveSalesOverTime = new Map();

      const rateCache = new Map<string, number>();
      const convertSales = async (
        amount: number,
        fromCurrency: string | null,
        dayIso: string
      ) => {
        if (!fromCurrency) return 0;
        const key = `${dayIso}|${fromCurrency.toUpperCase()}|${currency}`;
        const cached = rateCache.get(key);
        if (cached !== undefined) return amount * cached;
        const rate = await converter.convert(
          1,
          fromCurrency,
          currency,
          new Date(dayIso)
        );
        rateCache.set(key, rate);
        return amount * rate;
      };

      await Promise.all(
        rows.map(async (row) => {
          const dayIso = new Date(row.day as any).toISOString().slice(0, 10);
          const sales = Number(row.sales ?? 0) || 0;
          const converted = await convertSales(
            sales,
            row.currency_code,
            dayIso
          );
          effectiveTotalSales += converted;
          effectiveSalesOverTime.set(
            dayIso,
            (effectiveSalesOverTime.get(dayIso) ?? 0) + converted
          );
        })
      );
    }

    let countryTotals: OrdersResponse["country_totals"] | undefined;
    if (country_summary) {
      const { result: countryTotalsResult } = await countryTotalsWorkflow(
        req.scope
      ).run({
        input: {
          from: rangeFrom,
          to: rangeTo,
          statuses: ALLOWED_STATUSES,
          currency,
        },
      });

      countryTotals = countryTotalsResult.countryTotals;
      warnings.push(...countryTotalsResult.warnings);
    }

    const response: OrdersResponse = {
      range,
      currency,
      kpis: {
        total_orders: totalOrders,
        total_sales: effectiveTotalSales,
      },
      series: {
        orders: mapToSeries(ordersOverTime),
        sales: mapToSeries(effectiveSalesOverTime),
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
    return res.status(500).json({ message });
  }
}
