import { z } from "zod";
import { PRESETS } from "../types/presets";
import { ALLOWED_CURRENCIES } from "../types/currencies";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

export const PresetSchema = z.object({
  preset: z
    .enum(PRESETS)
    .optional()
    .default("this-month")
    .describe(`Preset for date range. One of: ${PRESETS.join(", ")}`),
});

export const CurrencySelectorSchema = z.object({
  currency: z
    .enum(ALLOWED_CURRENCIES)
    .optional()
    .default("original")
    .describe(
      "Currency selector. One of: original, USD, AED, KWD, GBP. 'original' uses the order's original currency."
    ),
});

export const CountrySummarySchema = z.object({
  country_summary: z
    .preprocess((val) => {
      if (typeof val === "string") {
        return val.toLowerCase() === "true";
      }
      return Boolean(val);
    }, z.boolean())
    .optional()
    .default(false)
    .describe("Include aggregated totals per country when true."),
});

export const AnalyticsOrdersQuerySchema = createFindParams()
  .merge(PresetSchema)
  .merge(CurrencySelectorSchema)
  .merge(CountrySummarySchema)
  .extend({
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.preset === "custom") {
      if (!value.from) {
        ctx.addIssue({
          code: "custom",
          message: "'from' is required when preset is custom",
          path: ["from"],
        });
      }
      if (!value.to) {
        ctx.addIssue({
          code: "custom",
          message: "'to' is required when preset is custom",
          path: ["to"],
        });
      }
    }
  });

export type AnalyticsOrdersQuery = z.infer<typeof AnalyticsOrdersQuerySchema>;
