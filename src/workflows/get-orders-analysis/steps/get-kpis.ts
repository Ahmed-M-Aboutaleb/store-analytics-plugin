import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ANALYSIS_MODULE } from "../../../modules/analysis";
import AnalysisModuleService from "../../../modules/analysis/service";

type GetOrdersKPIsWorkflowInput = {
  fromDate: string;
  toDate: string;
};

const getOrdersKPIsStep = createStep(
  "get-orders-kpis",
  async ({ fromDate, toDate }: GetOrdersKPIsWorkflowInput, { container }) => {
    const analysisModuleService: AnalysisModuleService =
      container.resolve(ANALYSIS_MODULE);

    const kpis = await analysisModuleService.getOrderKPIs(fromDate, toDate);

    return new StepResponse(kpis, kpis);
  },
  async (kpis) => {
    if (!kpis) {
      return new StepResponse(null, null);
    }
  }
);

export { getOrdersKPIsStep, GetOrdersKPIsWorkflowInput };
