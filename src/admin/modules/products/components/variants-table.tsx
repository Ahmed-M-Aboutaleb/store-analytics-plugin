import { Skeleton, Table, Text } from "@medusajs/ui";
import { useDashboardData } from "../../../providers/dashboard-data-context";

const VariantsTable = () => {
  const { data, isLoading } = useDashboardData();

  const variants = data?.products?.top_variants || [];
  return (
    <div className="overflow-x-auto">
      {isLoading ? (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className="w-[70%]">Variant</Table.HeaderCell>
              <Table.HeaderCell className="w-[30%]">Sold</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {Array.from({ length: 5 }).map((_, idx) => (
              <Table.Row key={`skeleton-${idx}`}>
                <Table.Cell>
                  <Skeleton className="h-4 w-64" />
                </Table.Cell>
                <Table.Cell>
                  <Skeleton className="h-4 w-16" />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      ) : (
        <>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell className="w-[70%]">Variant</Table.HeaderCell>
                <Table.HeaderCell className="w-[30%]">Sold</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {variants.length === 0 ? (
                <Table.Row>
                  <Table.Cell className="text-ui-fg-subtle text-center h-24">
                    No variants found
                  </Table.Cell>
                </Table.Row>
              ) : (
                variants.map((variant: any, index: number) => {
                  return (
                    <Table.Row key={index}>
                      <Table.Cell>
                        <Text size="small" weight="plus">
                          {variant.product_title}
                        </Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          {variant.variant_title}
                        </Text>
                      </Table.Cell>

                      <Table.Cell>
                        <div className="flex flex-col gap-y-1">
                          <Text size="small">{variant.quantity}</Text>
                          {/* <div className="h-1 w-full max-w-[60px] bg-ui-bg-component-hover rounded-full overflow-hidden">
                            <div
                              className="h-full bg-ui-fg-base transition-all duration-500"
                              style={{ width: `${relativeWidth}%` }}
                            />
                          </div> */}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              )}
            </Table.Body>
          </Table>
        </>
      )}
    </div>
  );
};

export default VariantsTable;
