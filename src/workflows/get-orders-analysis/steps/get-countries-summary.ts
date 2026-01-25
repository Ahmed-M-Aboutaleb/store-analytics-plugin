import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ANALYSIS_MODULE } from "../../../modules/analysis";
import AnalysisModuleService from "../../../modules/analysis/service";
import { CountryKPI, CurrencySelector, SeriesPoint } from "../../../types";

type GetOrdersCountriesSummaryWorkflowInput = {
  fromDate: string;
  toDate: string;
  currencyCode: CurrencySelector;
  timezone?: string;
};

async function normalizeCountriesSummary(
  countriesSummary: CountryKPI[],
  currencyCode: CurrencySelector,
  analysisModuleService: AnalysisModuleService,
  container: any,
) {
  const converter = analysisModuleService.resolveCurrencyConverter(
    container,
    currencyCode,
  );
  if (!converter) {
    return;
  }
  const normalizedCountriesSummary = [] as CountryKPI[];
  for (const summary of countriesSummary) {
    const [convertedAmount, convertedFees] = await Promise.all([
      converter.convert(
        summary.amount,
        summary.currency,
        currencyCode,
        new Date(),
      ),
      converter.convert(
        summary.fees,
        summary.currency,
        currencyCode,
        new Date(),
      ),
    ]);
    normalizedCountriesSummary.push({
      country_code: summary.country_code,
      currency: currencyCode,
      amount: convertedAmount,
      fees: convertedFees,
      net: convertedAmount - convertedFees,
    });
  }
  return normalizedCountriesSummary;
}

const getOrdersCountriesSummaryStep = createStep(
  "get-orders-countries-summary",
  async (
    {
      fromDate,
      toDate,
      currencyCode,
      timezone,
    }: GetOrdersCountriesSummaryWorkflowInput,
    { container },
  ) => {
    const analysisModuleService: AnalysisModuleService =
      container.resolve(ANALYSIS_MODULE);

    const countriesSummary =
      await analysisModuleService.getOrdersCountrySummary(
        fromDate,
        toDate,
        timezone,
      );
    if (currencyCode !== "original") {
      const normalizedCountriesSummary = await normalizeCountriesSummary(
        countriesSummary,
        currencyCode,
        analysisModuleService,
        container,
      );
      return new StepResponse(
        normalizedCountriesSummary,
        normalizedCountriesSummary,
      );
    }
    return new StepResponse(countriesSummary, countriesSummary);
  },
);

export {
  getOrdersCountriesSummaryStep as getOrdersCountriesSummaryStep,
  GetOrdersCountriesSummaryWorkflowInput,
};
