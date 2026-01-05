import {
  ResolvedRange,
  SeriesPoint,
  CurrencySelector,
} from "../../../../types";

export type ProductsResponse = {
  range: ResolvedRange;
  currency: CurrencySelector;
  series: {
    new_customers: SeriesPoint[];
  };
  top_variants: {
    variant_id: string;
    variant_title: string;
    quantity: number;
    revenue: number;
  }[];
  warnings?: string[];
};
