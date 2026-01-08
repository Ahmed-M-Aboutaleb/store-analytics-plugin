
type ProductsResponse = {
  top_variants: TopVariant[];
};

type TopVariant = {
  product_title: string;
  variant_title: string;
  quantity: number;
};

export { ProductsResponse };
