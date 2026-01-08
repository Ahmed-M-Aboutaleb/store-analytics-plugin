import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  getOrdersKPIsStep,
  GetOrdersKPIsWorkflowInput,
} from "./steps/get-kpis";

type GetOrdersAnalysisWorkflowOutput = {
  fromDate: string;
  toDate: string;
};

export const getOrdersAnalysisWorkflow = createWorkflow(
  "get-orders-kpis-workflow",
  (input: GetOrdersAnalysisWorkflowOutput) => {
    const KPIS_INPUT: GetOrdersKPIsWorkflowInput = {
      fromDate: input.fromDate,
      toDate: input.toDate,
    };
    const kpis = getOrdersKPIsStep(KPIS_INPUT);
    const RESULT = {
      kpis,
    };
    return new WorkflowResponse(RESULT);
  }
);
