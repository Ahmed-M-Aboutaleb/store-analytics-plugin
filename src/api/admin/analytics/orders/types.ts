export const PRESETS = [
  "custom",
  "this-month",
  "last-month",
  "last-3-months",
] as const;
export type Preset = (typeof PRESETS)[number];

export const ALLOWED_CURRENCIES = [
  "original",
  "USD",
  "AED",
  "KWD",
  "GBP",
] as const;

export type CurrencySelector = (typeof ALLOWED_CURRENCIES)[number];

export type ResolvedRange = {
  preset: Preset;
  from: string;
  to: string;
};

export type SeriesPoint = {
  date: string;
  value: number;
};

export type OrdersResponse = {
  range: ResolvedRange;
  currency: CurrencySelector;
  kpis: {
    total_orders: number;
    total_sales: number;
  };
  series: {
    orders: SeriesPoint[];
    sales: SeriesPoint[];
  };
  orders: {
    count: number;
    limit: number;
    offset: number;
    data: Array<{
      id: string;
      display_id: number | null;
      created_at: Date | string;
      country_code: string | null;
      currency_code: string | null;
      subtotal: number | null;
      tax_total: number | null;
      total: number | null;
      stripe_fees: number | null;
      stripe_fees_currency: string | null;
      converted?: {
        currency: string;
        subtotal: number | null;
        tax_total: number | null;
        total: number | null;
        stripe_fees: number | null;
      };
    }>;
  };
  country_totals?: {
    rows: Array<{
      country_code: string | null;
      currency_code: string | null;
      amount: number;
      fees: number;
      net: number;
    }>;
    totals: {
      amount: number;
      fees: number;
      net: number;
    };
    per_currency_totals?: Array<{
      currency_code: string | null;
      amount: number;
      fees: number;
      net: number;
    }>;
    normalized: boolean;
  };
  warnings?: string[];
};

/**
 * Optional converter contract. Implement as a scoped service named "currencyNormalizationService"
 * with a convert method performing historical FX lookups and caching.
 */
export type CurrencyNormalizationService = {
  convert: (
    amount: number,
    from: string,
    to: string,
    at: Date
  ) => Promise<number>;
};
