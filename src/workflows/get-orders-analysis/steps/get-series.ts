import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ANALYSIS_MODULE } from "../../../modules/analysis";
import AnalysisModuleService from "../../../modules/analysis/service";
import { CurrencySelector, SeriesPoint } from "../../../types";

type GetOrdersSeriesWorkflowInput = {
  fromDate: string;
  toDate: string;
  currencyCode: CurrencySelector;
};

async function normalizeSalesCurrency(
  sales: Record<string, SeriesPoint[]>,
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
  // Normalize Orders Series
  const normalizedSalesSeries = [] as { date: string; value: number }[];
  for (const [currency, points] of Object.entries(sales)) {
    for (const point of points) {
      const convertedValue = await converter.convert(
        point.value,
        currency,
        currencyCode,
        new Date(point.date)
      );
      const existingPoint = normalizedSalesSeries.find(
        (p) => p.date === point.date
      );
      if (existingPoint) {
        existingPoint.value += convertedValue;
      } else {
        normalizedSalesSeries.push({
          date: point.date,
          value: convertedValue,
        });
      }
    }
  }
  normalizedSalesSeries.sort((a, b) => a.date.localeCompare(b.date));

  return {
    [currencyCode]: normalizedSalesSeries,
  };
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
    if (currencyCode !== "original") {
      const normalizedSeries = await normalizeSalesCurrency(
        series.sales,
        currencyCode,
        analysisModuleService,
        container
      );
      return new StepResponse(
        {
          orders: series.orders,
          sales: normalizedSeries!,
        },
        {
          orders: series.orders,
          sales: normalizedSeries!,
        }
      );
    }
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
