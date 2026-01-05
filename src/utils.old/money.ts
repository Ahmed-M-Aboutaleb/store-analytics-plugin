import { CurrencyNormalizationService, CurrencySelector } from "../types";

export const createCurrencyFormatter = (
  code: string | null | undefined,
  options?: Intl.NumberFormatOptions
) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code || "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    ...options,
  });

export const formatCurrency = (
  value: number | null | undefined,
  code: string | null | undefined,
  options?: Intl.NumberFormatOptions
) => createCurrencyFormatter(code, options).format(value ?? 0);

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
