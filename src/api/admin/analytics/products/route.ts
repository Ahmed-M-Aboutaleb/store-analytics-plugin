import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import StoreAnalyticsModuleService from "../../../../modules/store-analytics/service";
import { STORE_ANALYTICS_MODULE } from "../../../../modules/store-analytics";
import {
  ALLOWED_CURRENCIES,
  CurrencySelector,
  PRESETS,
  Preset,
} from "../orders/types";
import { ProductsResponse } from "./types";
import { mapToSeries, resolveRange } from "../../../../utils";
import { resolveConverter } from "../../../../utils/converter";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // console.log("--- TEST: Route Hit ---");
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

    // default limit for top variants
    const limit = req.query.limit ? Number(req.query.limit) : 5;

    const range = resolveRange(
      preset,
      req.query.from as string | undefined,
      req.query.to as string | undefined
    );
    const rangeFrom = new Date(range.from);
    const rangeTo = new Date(range.to);

    const storeAnalytics = req.scope.resolve<StoreAnalyticsModuleService>(
      STORE_ANALYTICS_MODULE
    );

    const warnings: string[] = [];
    // Converter logic kept for future parity, though aggregation usually returns base currency
    const converter = resolveConverter(req.scope, currency, warnings);

    const [newCustomersMap, topVariants] = await Promise.all([
      storeAnalytics.getNewCustomersOverTime(rangeFrom, rangeTo),
      storeAnalytics.getTopVariants(rangeFrom, rangeTo, limit),
    ]);

    // console.log("--- TEST: Service Results ---");
    // console.log("New Customers Map Size:", newCustomersMap.size);
    // console.log("Top Variants Count:", topVariants.length);
    // if (topVariants.length > 0) {
    //   console.log("First Variant:", topVariants[0]);
    // }

    const response: ProductsResponse = {
      range,
      currency,
      series: {
        new_customers: mapToSeries(newCustomersMap),
      },
      top_variants: topVariants,
      warnings: warnings.length ? warnings : undefined,
    };

    return res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return res.status(400).json({ message });
  }
}
