
type ProductsResponse = {
  top_variants: TopVariant[];
};

type TopVariant = {
  variant_id: string;
  variant_title: string;
  quantity: number;
  revenue: number;
};

export { ProductsResponse };
