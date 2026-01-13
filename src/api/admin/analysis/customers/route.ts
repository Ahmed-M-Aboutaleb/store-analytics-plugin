import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { resolveRange } from "../../../../utils/date";
import { CurrencySelector, Preset } from "../../../../types";
import { getCustomersAnalysisWorkflow } from "../../../../workflows/get-customers-analysis";

type AnalyticsCustomersQuery = {
  preset?: Preset;
  from?: string;
  to?: string;
  currency?: CurrencySelector;
  limit?: number;
  offset?: number;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { preset, from, to, currency }: AnalyticsCustomersQuery =
    req.validatedQuery;

  const { from: resolvedFrom, to: resolvedTo } = resolveRange(
    preset!,
    from,
    to
  );
  const { result } = await getCustomersAnalysisWorkflow(req.scope).run({
    input: {
      fromDate: resolvedFrom.toISOString(),
      toDate: resolvedTo.toISOString(),
      currencyCode: currency || "original",
    },
  });

  res.status(200).json({ ...result });
}
