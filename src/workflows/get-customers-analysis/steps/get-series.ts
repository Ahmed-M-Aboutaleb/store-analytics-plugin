import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ANALYSIS_MODULE } from "../../../modules/analysis";
import AnalysisModuleService from "../../../modules/analysis/service";

type GetCustomersSeriesInput = {
  fromDate: string;
  toDate: string;
};

const getCustomersSeriesStep = createStep(
  "get-customers-series",
  async ({ fromDate, toDate }: GetCustomersSeriesInput, { container }) => {
    const analysisModuleService: AnalysisModuleService =
      container.resolve(ANALYSIS_MODULE);

    const series = await analysisModuleService.getCustomersSeries(
      fromDate,
      toDate
    );

    return new StepResponse(series);
  }
);

export { getCustomersSeriesStep };
