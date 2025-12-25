import { MedusaRequest } from "@medusajs/framework/http";
import {
  CurrencyNormalizationService,
  CurrencySelector,
} from "../api/admin/analytics/orders/types";

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
      "currencyNormalizationService not configured; returning original currency amounts"
    );
    return null;
  }
}
