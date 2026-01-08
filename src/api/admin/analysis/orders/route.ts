import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getOrdersAnalysisWorkflow } from "../../../../workflows/get-orders-analysis";
import { resolveRange } from "../../../../utils/date";
import { Preset } from "../../../../types";
type AnalyticsOrdersQuery = {
  preset?: Preset;
  from?: string;
  to?: string;
  currency_code?: string;
  country_summary?: boolean;
  limit?: number;
  offset?: number;
};
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const {
    preset,
    from,
    to,
    currency_code,
    country_summary,
    limit,
    offset,
  }: AnalyticsOrdersQuery = req.validatedQuery;
  const { from: resolvedFrom, to: resolvedTo } = resolveRange(
    preset!,
    from,
    to
  );
  console.log("Settings: ", {
    from,
    to,
    preset,
    currency_code,
    country_summary,
    limit,
    offset,
    resolvedFrom,
    resolvedTo,
  });
  const { result } = await getOrdersAnalysisWorkflow(req.scope).run({
    input: {
      fromDate: resolvedFrom.toISOString(),
      toDate: resolvedTo.toISOString(),
    },
  });
  res.status(200).json({ ...result });
}
