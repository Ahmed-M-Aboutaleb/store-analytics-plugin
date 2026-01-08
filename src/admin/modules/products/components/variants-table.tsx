import { Skeleton, Table, Text } from "@medusajs/ui";
import { useDashboardData } from "../../../providers/dashboard-data-context";
import { useDashboardFilters } from "../../../providers/dashboard-filter-context";

const VariantsTable = () => {
  const { filters } = useDashboardFilters();
  const { isLoading, data } = useDashboardData();

  return (
    <div>
      <Table style={{ tableLayout: "fixed" }}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell className="w-[70%]">Variant</Table.HeaderCell>
            <Table.HeaderCell className="w-[30%]">Sold</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        {isLoading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <Table.Row key={idx}>
                <Table.Cell>
                  <Skeleton className="h-4 w-64" />
                </Table.Cell>
                <Table.Cell>
                  <Skeleton className="h-4 w-64" />
                </Table.Cell>
              </Table.Row>
            ))
          : data?.products?.top_variants && (
              <Table.Body>
                {data?.products?.top_variants?.map((variant) => (
                  <Table.Row key={variant.product_title}>
                    <Table.Cell>
                      <Text size="small" weight="plus">
                        {variant.product_title} - {variant.variant_title}
                      </Text>
                    </Table.Cell>

                    <Table.Cell>
                      <Text size="small">{variant.quantity}</Text>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            )}
      </Table>
    </div>
  );
};

export default VariantsTable;
