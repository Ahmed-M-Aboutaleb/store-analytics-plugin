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

type GetOrdersAnalysisWorkflowOutput = {
  fromDate: string;
  toDate: string;
  currencyCode: CurrencySelector;
};

const COUNTRYKPIS_MOCK = [
  {
    country_code: "US",
    currency: "usd",
    amount: 30000,
    fees: 1200,
    net: 28800,
  },
  {
    country_code: "IT",
    currency: "eur",
    amount: 15000,
    fees: 600,
    net: 14400,
  },
  {
    country_code: "AE",
    currency: "aed",
    amount: 10000,
    fees: 400,
    net: 9600,
  },
  {
    country_code: "FR",
    currency: "eur",
    amount: 5000,
    fees: 200,
    net: 4800,
  },
];

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
    const RESULT = {
      kpis,
      series,
      country_kpis: COUNTRYKPIS_MOCK,
    };
    return new WorkflowResponse(RESULT);
  }
);
