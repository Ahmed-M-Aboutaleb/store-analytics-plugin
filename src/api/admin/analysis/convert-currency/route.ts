import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ANALYSIS_MODULE } from "../../../../modules/analysis";
import AnalysisModuleService from "../../../../modules/analysis/service";
import { AnalysisConvertCurrencyQuery } from "../../../validation-schemas";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { base, target, date, amount }: AnalysisConvertCurrencyQuery =
    req.validatedQuery as AnalysisConvertCurrencyQuery;
  const analysisModule: AnalysisModuleService =
    req.scope.resolve(ANALYSIS_MODULE);
  const converter = analysisModule.resolveCurrencyConverter(req.scope, target);
  if (!converter) {
    res.status(400).json({
      error: "Currency converter not available for the given 'from' currency.",
    });
    return;
  }
  const result = await converter.convert(
    Number(amount),
    base,
    target,
    new Date(date)
  );

  res.status(200).json({ result });
}
