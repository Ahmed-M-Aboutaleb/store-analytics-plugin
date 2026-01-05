import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { OrderStatus } from "@medusajs/framework/utils";

import StoreAnalyticsModuleService from "../../modules/store-analytics/service";
import { STORE_ANALYTICS_MODULE } from "../../modules/store-analytics";
import { CurrencySelector, OrdersResponse } from "../../types";
import { resolveConverter } from "../../utils/converter";

export type CountryTotalsInput = {
  from: Date | string;
  to: Date | string;
  statuses: OrderStatus[];
  currency: CurrencySelector;
};

export type CountryTotalsOutput = {
  countryTotals: OrdersResponse["country_totals"];
  warnings: string[];
};

export const countryTotalsStep = createStep(
  "country-totals",
  async (input: CountryTotalsInput, { container }) => {
    const storeAnalytics = container.resolve<StoreAnalyticsModuleService>(
      STORE_ANALYTICS_MODULE
    );

    const from = new Date(input.from);
    const to = new Date(input.to);

    const aggregates = await storeAnalytics.getCountryTotals(
      from,
      to,
      input.statuses
    );

    const warnings: string[] = [];
    const converter = resolveConverter(
      container as any,
      input.currency,
      warnings
    );
    const shouldConvert = input.currency !== "original" && !!converter;

    const originalCurrencies = new Set<string>();
    const midDate = new Date((from.getTime() + to.getTime()) / 2);

    const rows = await Promise.all(
      aggregates.map(async (row) => {
        const baseAmount = row.amount ?? 0;
        const baseFees = row.fees ?? 0;

        if (!shouldConvert) {
          if (row.currency_code) {
            originalCurrencies.add(row.currency_code.toUpperCase());
          }
          return {
            country_code: row.country_code,
            currency_code: row.currency_code ?? null,
            amount: baseAmount,
            fees: baseFees,
            net: baseAmount - baseFees,
          };
        }

        if (!row.currency_code || !converter) {
          return {
            country_code: row.country_code,
            currency_code: row.currency_code ?? null,
            amount: baseAmount,
            fees: baseFees,
            net: baseAmount - baseFees,
          };
        }

        const convertedAmount = await converter.convert(
          baseAmount,
          row.currency_code.toUpperCase(),
          input.currency,
          midDate
        );
        const convertedFees = await converter.convert(
          baseFees,
          row.currency_code.toUpperCase(),
          input.currency,
          midDate
        );

        return {
          country_code: row.country_code,
          currency_code: row.currency_code ?? null,
          amount: convertedAmount,
          fees: convertedFees,
          net: convertedAmount - convertedFees,
        };
      })
    );

    rows.sort((a, b) => b.amount - a.amount);

    const totals = rows.reduce(
      (acc, row) => {
        acc.amount += row.amount;
        acc.fees += row.fees;
        acc.net += row.net;
        return acc;
      },
      { amount: 0, fees: 0, net: 0 }
    );

    let perCurrencyTotals: CountryTotalsOutput extends {
      per_currency_totals?: infer T;
    }
      ? T
      :
          | Array<{
              currency_code: string | null;
              amount: number;
              fees: number;
              net: number;
            }>
          | undefined;

    if (!shouldConvert && originalCurrencies.size > 1) {
      const map = new Map<
        string,
        { amount: number; fees: number; net: number }
      >();
      rows.forEach((row) => {
        const code = (row.currency_code ?? "UNKNOWN").toUpperCase();
        const current = map.get(code) ?? { amount: 0, fees: 0, net: 0 };
        current.amount += row.amount;
        current.fees += row.fees;
        current.net += row.net;
        map.set(code, current);
      });
      perCurrencyTotals = Array.from(map.entries()).map(
        ([currency_code, totals]) => ({
          currency_code,
          amount: totals.amount,
          fees: totals.fees,
          net: totals.net,
        })
      );
    }

    const countryTotals: CountryTotalsOutput["countryTotals"] = {
      rows,
      totals,
      per_currency_totals: perCurrencyTotals,
      normalized: shouldConvert || originalCurrencies.size <= 1,
    };

    return new StepResponse({ countryTotals, warnings });
  }
);

const countryTotalsWorkflow = createWorkflow(
  "country-totals",
  (input: CountryTotalsInput) => {
    const result = countryTotalsStep(input);
    return new WorkflowResponse(result);
  }
);

export default countryTotalsWorkflow;
