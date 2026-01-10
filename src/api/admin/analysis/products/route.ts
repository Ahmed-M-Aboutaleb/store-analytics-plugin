import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getProductAnalysisWorkflow } from "../../../../workflows/get-products-analysis";
import { resolveRange } from "../../../../utils/date";
import { Preset } from "../../../../types";

type AnalyticsProductsQuery = {
  preset?: Preset;
  from?: string;
  to?: string;
  // currency_code?: string;
  limit?: number; 
  offset?: number; 
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const {
    preset,
    from,
    to,
    // currency_code,
    limit = 10,
    offset = 0,
  }: AnalyticsProductsQuery = req.validatedQuery;

  const { from: resolvedFrom, to: resolvedTo } = resolveRange(
    preset!,
    from,
    to
  );

  console.log("Product Analytics Settings: ", {
    limit,
    offset,
    // currency_code,
    resolvedFrom,
    resolvedTo,
  });

  const { result } = await getProductAnalysisWorkflow(req.scope).run({
    input: {
      fromDate: resolvedFrom.toISOString(),
      toDate: resolvedTo.toISOString(),
    },
  });

  res.status(200).json({ ...result });
}
