const ALLOWED_CURRENCIES = ["original", "USD", "AED", "KWD", "GBP"] as const;

type CurrencySelector = (typeof ALLOWED_CURRENCIES)[number];

type CurrencyNormalizationService = {
  convert: (
    amount: number,
    from: string | null,
    to: CurrencySelector | string,
    at: Date
  ) => Promise<number>;
};

export { ALLOWED_CURRENCIES, CurrencySelector, CurrencyNormalizationService };
