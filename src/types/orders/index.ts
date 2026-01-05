import { SeriesPoint } from "../charts";
import { CurrencySelector } from "../currencies";
import { ResolvedRange } from "../presets";

type KPIs = {
  total_orders: number;
  total_sales: number;
};

type Series = {
  orders: SeriesPoint[];
  sales: SeriesPoint[];
};

type Order = {
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
    currency: CurrencySelector;
    subtotal: number | null;
    tax_total: number | null;
    total: number | null;
    stripe_fees: number | null;
  };
};

type CountryTotalRow = {
  country_code: string | null;
  currency_code: string | null;
  amount: number;
  fees: number;
  net: number;
};

type OrdersResponse = {
  range: ResolvedRange;
  currency: CurrencySelector;
  kpis: KPIs;
  series: Series;
  orders: {
    count: number;
    limit: number;
    offset: number;
    data: Order[];
  };
  country_totals?: {
    rows: CountryTotalRow[];
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

export { OrdersResponse, Order, CountryTotalRow, KPIs, Series };
