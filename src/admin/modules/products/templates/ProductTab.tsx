import { Table, Text } from "@medusajs/ui";
import { useDashboardData } from "../../../providers/dashboard-data-context";

const ProductTab = () => {
  const { refetch, data } = useDashboardData();
  useEffect(() => {
    refetch("/admin/dashboard/products");
  }, [refetch]);
  console.log(data?.products);
  return (
    <div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Variant Title</Table.HeaderCell>
            <Table.HeaderCell>Product</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Sold</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Revenue</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            {data?.products?.top_variants.map((variant) => (
              <Table.Row key={variant.variant_id}>
                <Table.Cell>
                  <Text size="small" weight="plus">
                    {variant.variant_title}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" weight="plus">
                    {variant.variant_id}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" weight="plus">
                    {variant.revenue}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" weight="plus">
                    {variant.quantity}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Row>
        </Table.Body>
      </Table>
    </div>
  );
};

export default ProductTab;
