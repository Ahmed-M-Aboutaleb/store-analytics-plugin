import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ANALYSIS_MODULE } from "../../../modules/analysis";
import AnalysisModuleService from "../../../modules/analysis/service";
import { CurrencySelector, OrderKPI } from "../../../types";

type GetOrdersSeriesWorkflowInput = {
  fromDate: string;
  toDate: string;
  currencyCode: CurrencySelector;
};

async function normalizeKPIsCurrency(
  kpis: OrderKPI[],
  currencyCode: CurrencySelector,
  analysisModuleService: AnalysisModuleService,
  container: any
) {
  const converter = analysisModuleService.resolveCurrencyConverter(
    container,
    currencyCode
  );
  if (!converter) {
    return;
  }
  const normalizedKPIs: OrderKPI[] = [
    {
      currency_code: currencyCode,
      total_orders: 0,
      total_sales: 0,
    },
  ];
  for (const kpi of kpis) {
    normalizedKPIs[0].total_orders += kpi.total_orders;
    normalizedKPIs[0].total_sales += await converter.convert(
      kpi.total_sales,
      kpi.currency_code,
      currencyCode,
      new Date()
    );
  }
  return normalizedKPIs;
}

const getOrdersSeriesStep = createStep(
  "get-orders-series",
  async (
    { fromDate, toDate, currencyCode }: GetOrdersSeriesWorkflowInput,
    { container }
  ) => {
    const analysisModuleService: AnalysisModuleService =
      container.resolve(ANALYSIS_MODULE);

    const series = await analysisModuleService.getOrdersSeries(
      fromDate,
      toDate
    );
    return new StepResponse(series, series);
  },
  async (series) => {
    if (!series) {
      return new StepResponse(null, null);
    }
  }
);

export {
  getOrdersSeriesStep as getOrdersSeriesStep,
  GetOrdersSeriesWorkflowInput,
};
