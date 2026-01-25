import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ANALYSIS_MODULE } from "../../../modules/analysis";
import AnalysisModuleService from "../../../modules/analysis/service";
import { CurrencySelector, OrderKPI } from "../../../types";

type GetOrdersKPIsWorkflowInput = {
  fromDate: string;
  toDate: string;
  currencyCode: CurrencySelector;
  timezone?: string;
};

const getOrdersKPIsStep = createStep(
  "get-orders-kpis",
  async (
    { fromDate, toDate, currencyCode, timezone }: GetOrdersKPIsWorkflowInput,
    { container },
  ) => {
    const analysisModuleService: AnalysisModuleService =
      container.resolve(ANALYSIS_MODULE);
    const converter = analysisModuleService.resolveCurrencyConverter(
      container,
      currencyCode,
    );
    const kpis = await analysisModuleService.getOrderKPIs(
      fromDate,
      toDate,
      currencyCode,
      converter,
      timezone?.toString() || "UTC",
    );
    return new StepResponse(kpis, kpis);
  },
  async (kpis) => {
    if (!kpis) {
      return new StepResponse(null, null);
    }
  },
);

export { getOrdersKPIsStep, GetOrdersKPIsWorkflowInput };
