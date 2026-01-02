import { MedusaRequest } from "@medusajs/framework/http";
import {
  CurrencyNormalizationService,
  CurrencySelector,
} from "../api/admin/analytics/orders/types";
import { frankfurterConverter } from "./frankfurter-converter";

export function resolveConverter(
  scope: MedusaRequest["scope"],
  currency: CurrencySelector,
  warnings: string[]
): CurrencyNormalizationService | null {
  if (currency === "original") {
    return null;
  }

  try {
    return scope.resolve<CurrencyNormalizationService>(
      "currencyNormalizationService"
    );
  } catch {
    warnings.push(
      "currencyNormalizationService not configured; using Frankfurter public rates instead"
    );
    warnings.push(
      "Frankfurter rates are for demo/testing only; add your own currencyNormalizationService for production"
    );
    return frankfurterConverter;
  }
}
