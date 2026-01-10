import { Skeleton, Table, Text } from "@medusajs/ui";
import { useDashboardData } from "../../../providers/dashboard-data-context";
import { useEffect, useMemo, useState } from "react";

const VariantsTable = () => {
  const { data, isLoading, refetch } = useDashboardData();

  const variants = data?.products?.top_variants || [];

  const totalVariants = data?.products?.total_variants ?? variants.length;

  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  const pageCount = Math.ceil(totalVariants / pageSize);

  const canNextPage = useMemo(
    () => pageIndex < pageCount - 1,
    [pageIndex, pageCount]
  );
  const canPreviousPage = useMemo(() => pageIndex > 0, [pageIndex]);

  useEffect(() => {
    setPageIndex(0);
  }, [totalVariants]);

  const handlePageChange = (newIndex: number) => {
    setPageIndex(newIndex);
    refetch("products", pageSize, newIndex * pageSize);
  };

  const maxQuantity = useMemo(() => {
    if (!variants.length) return 0;
    return Math.max(
      ...variants.map((v: any) => parseFloat(v.quantity || 0)),
      0
    );
  }, [variants]);

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
                // FIX 2: Client-side slice ensures UI respects pageSize even if backend returns everything
                variants
                  .slice(0, pageSize)
                  .map((variant: any, index: number) => {
                    const quantity = parseFloat(variant.quantity || 0);
                    const relativeWidth =
                      maxQuantity > 0 ? (quantity / maxQuantity) * 100 : 0;

                    // FIX 3: Unique key generation
                    const rowKey =
                      variant.id ||
                      `${variant.product_title}-${variant.variant_title}-${index}`;

                    return (
                      <Table.Row key={rowKey}>
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

          <Table.Pagination
            count={totalVariants}
            pageSize={pageSize}
            pageIndex={pageIndex}
            pageCount={pageCount}
            canPreviousPage={canPreviousPage}
            canNextPage={canNextPage}
            previousPage={() => handlePageChange(pageIndex - 1)}
            nextPage={() => handlePageChange(pageIndex + 1)}
          />
        </>
      )}
    </div>
  );
};

export default VariantsTable;
