import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ANALYSIS_MODULE } from "../../../modules/analysis";
import AnalysisModuleService from "../../../modules/analysis/service";

type GetCustomersKPIsInput = {
  fromDate: string;
  toDate: string;
};

export type CustomersKPIs = {
  new_count: number;
  total_count: number;
};

const getCustomersKPIsStep = createStep(
  "get-customers-kpis",
  async ({ fromDate, toDate }: GetCustomersKPIsInput, { container }) => {
    const analysisModuleService: AnalysisModuleService =
      container.resolve(ANALYSIS_MODULE);

    const kpis = await analysisModuleService.getCustomersKPIs(fromDate, toDate);

    return new StepResponse(kpis, kpis);
  },
  async (kpis) => {
    if (!kpis) {
      return new StepResponse(null, null);
    }
  }
);

export { getCustomersKPIsStep };
