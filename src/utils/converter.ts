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
      "If you face issues with currency conversion, just reselect the desired currency and try again."
    );
    return frankfurterConverter;
  }
}
