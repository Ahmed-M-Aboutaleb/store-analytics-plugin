import {
  CurrencyNormalizationService,
  CurrencySelector,
} from "../api/admin/analytics/orders/types";

export const normalizeAmount = async (
  amount: number | null,
  from: string | null,
  target: CurrencySelector,
  at: Date,
  converter: CurrencyNormalizationService | null
): Promise<number | null> => {
  if (amount === null || target === "original") {
    return amount;
  }
  if (!from) {
    return null;
  }
  if (!converter) {
    return null;
  }
  return converter.convert(amount, from.toUpperCase(), target, at);
};
