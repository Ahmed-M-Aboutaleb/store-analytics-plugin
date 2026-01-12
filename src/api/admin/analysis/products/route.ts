import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getProductAnalysisWorkflow } from "../../../../workflows/get-products-analysis";
import { resolveRange } from "../../../../utils/date";
import { Preset } from "../../../../types";

type AnalyticsProductsQuery = {
  preset?: Preset;
  from?: string;
  to?: string;
  limit?: number;
};

export async function GET(
  req: MedusaRequest<AnalyticsProductsQuery>,
  res: MedusaResponse
) {
  const { preset, from, to }: AnalyticsProductsQuery = req.validatedQuery;

  const { from: resolvedFrom, to: resolvedTo } = resolveRange(
    preset!,
    from,
    to
  );

  const { result } = await getProductAnalysisWorkflow(req.scope).run({
    input: {
      fromDate: resolvedFrom.toISOString(),
      toDate: resolvedTo.toISOString(),
    },
  });

  res.status(200).json({ top_variants: result.variants });
}
