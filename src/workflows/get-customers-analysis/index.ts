import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { CurrencySelector } from "../../types";
import { getCustomersKPIsStep } from "./steps/get-kpis";
import { getCustomersSeriesStep } from "./steps/get-series";

type GetCustomersAnalysisWorkflowInput = {
  fromDate: string;
  toDate: string;
  currencyCode: CurrencySelector;
};

export const getCustomersAnalysisWorkflow = createWorkflow(
  "get-customers-analysis-workflow",
  (input: GetCustomersAnalysisWorkflowInput) => {
    const STEP_INPUT = {
      fromDate: input.fromDate,
      toDate: input.toDate,
    };

    const kpis = getCustomersKPIsStep(STEP_INPUT);
    const series = getCustomersSeriesStep(STEP_INPUT);

    const RESULT = {
      kpis,
      series,
    };

    return new WorkflowResponse(RESULT);
  }
);