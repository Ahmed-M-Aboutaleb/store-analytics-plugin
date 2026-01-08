import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getOrdersAnalysisWorkflow } from "../../../../workflows/get-orders-analysis";
import { resolveRange } from "../../../../utils/date";
import { CurrencySelector, Preset } from "../../../../types";
type AnalyticsOrdersQuery = {
  preset?: Preset;
  from?: string;
  to?: string;
  currency?: CurrencySelector;
  country_summary?: boolean;
  limit?: number;
  offset?: number;
};
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const {
    preset,
    from,
    to,
    currency,
    country_summary,
    limit,
    offset,
  }: AnalyticsOrdersQuery = req.validatedQuery;
  const { from: resolvedFrom, to: resolvedTo } = resolveRange(
    preset!,
    from,
    to
  );
  console.log("AnalyticsOrdersQuery: ", {
    preset,
    from: resolvedFrom,
    to: resolvedTo,
    currency,
    country_summary,
    limit,
    offset,
  });
  const { result } = await getOrdersAnalysisWorkflow(req.scope).run({
    input: {
      fromDate: resolvedFrom.toISOString(),
      toDate: resolvedTo.toISOString(),
      currencyCode: currency || "original",
    },
  });
  res.status(200).json({ ...result });
}
