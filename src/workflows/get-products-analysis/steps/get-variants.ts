import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ANALYSIS_MODULE } from "../../../modules/analysis";
import AnalysisModuleService from "../../../modules/analysis/service";

type GetProductVariantsWorkflowInput = {
  fromDate: string;
  toDate: string;
};

const getProductVariantsStep = createStep(
  "get-product-variants",
  async (
    { fromDate, toDate }: GetProductVariantsWorkflowInput,
    { container },
  ) => {
    const analysisModuleService: AnalysisModuleService =
      container.resolve(ANALYSIS_MODULE);

    const variants = await analysisModuleService.getProductVariants(
      fromDate,
      toDate,
    );

    return new StepResponse(variants, variants);
  },
  async (variants) => {
    if (!variants) {
      return new StepResponse(null, null);
    }
  },
);

export { getProductVariantsStep, GetProductVariantsWorkflowInput };
