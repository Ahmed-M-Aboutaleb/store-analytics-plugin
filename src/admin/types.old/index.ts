export type DateRange = {
  from?: string;
  to?: string;
};

export type TopVariant = {
  variant_id: string;
  variant_title: string;
  product_title: string;
  quantity: number;
  revenue: number;
};

export type ProductsResponse = {
  range: {
    preset: string;
    from: string;
    to: string;
  };
  currency: string;
  series: {
    new_customers: Array<{ date: string; value: number }>;
  };
  top_variants: TopVariant[];
  warnings?: string[];
};
