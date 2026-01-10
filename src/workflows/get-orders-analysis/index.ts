import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  getOrdersKPIsStep,
  GetOrdersKPIsWorkflowInput,
} from "./steps/get-kpis";
import { CurrencySelector } from "../../types";
import { getOrdersSeriesStep } from "./steps/get-series";
import { getOrdersCountriesSummaryStep } from "./steps/get-countries-summary";

type GetOrdersAnalysisWorkflowOutput = {
  fromDate: string;
  toDate: string;
  currencyCode: CurrencySelector;
};

export const getOrdersAnalysisWorkflow = createWorkflow(
  "get-orders-kpis-workflow",
  (input: GetOrdersAnalysisWorkflowOutput) => {
    const KPIS_INPUT: GetOrdersKPIsWorkflowInput = {
      fromDate: input.fromDate,
      toDate: input.toDate,
      currencyCode: input.currencyCode,
    };
    const kpis = getOrdersKPIsStep(KPIS_INPUT);
    const series = getOrdersSeriesStep(KPIS_INPUT);
    const country_kpis = getOrdersCountriesSummaryStep(KPIS_INPUT);
    const RESULT = {
      kpis,
      series,
      country_kpis: country_kpis,
    };
    return new WorkflowResponse(RESULT);
  }
);
