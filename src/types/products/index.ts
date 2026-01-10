
type ProductsResponse = {
  top_variants: TopVariant[];
  total_variants: number;
};

type TopVariant = {
  product_title: string;
  variant_title: string;
  quantity: number;
};

export { ProductsResponse, TopVariant };
