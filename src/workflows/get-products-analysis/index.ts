import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  getProductVariantsStep,
  GetProductVariantsWorkflowInput,
} from "./steps/get-variants";

type GetProductsAnalysisWorkflowInput = {
  fromDate: string;
  toDate: string;
};

export const getProductAnalysisWorkflow = createWorkflow(
  "get-product-variants-workflow",
  (input: GetProductsAnalysisWorkflowInput) => {
    const VARIANTS_INPUT: GetProductsAnalysisWorkflowInput = {
      fromDate: input.fromDate,
      toDate: input.toDate,
    };

    const variants = getProductVariantsStep(VARIANTS_INPUT);
    const RESULT = {
      variants,
    };
    return new WorkflowResponse(RESULT);
  }
);
