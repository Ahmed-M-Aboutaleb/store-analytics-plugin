import { Skeleton, Table } from "@medusajs/ui";
import { useDashboardData } from "../../../providers/dashboard-data-context";
import { useMemo, useState } from "react";
import { formatDate } from "../../../../utils/date";
import { formatMoney } from "../../../../utils/money";

const OrdersTable = () => {
  const { data, isLoading, refetch } = useDashboardData();

  const orders = data?.orders?.orders || [];
  const totalOrders = data?.orders?.kpis.totalOrders ?? 0;

  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 200;

  const pageCount = Math.ceil(totalOrders / pageSize);

  const canNextPage = useMemo(
    () => pageIndex < pageCount - 1,
    [pageIndex, pageCount]
  );
  const canPreviousPage = useMemo(() => pageIndex - 1 >= 0, [pageIndex]);

  const handlePageChange = (newIndex: number) => {
    setPageIndex(newIndex);
    refetch("orders", pageSize, newIndex * pageSize);
  };

  return (
    <>
      {isLoading ? (
        <Skeleton className="h-48 w-full mb-4" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>#</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Country</Table.HeaderCell>
                <Table.HeaderCell>Subtotal (before tax)</Table.HeaderCell>
                <Table.HeaderCell>Customer Tax</Table.HeaderCell>
                <Table.HeaderCell>Gross</Table.HeaderCell>
                <Table.HeaderCell>Payment Gateway Fees</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {orders.length === 0 ? (
                <Table.Row>
                  <Table.Cell className="text-ui-fg-subtle">
                    No orders found
                  </Table.Cell>
                </Table.Row>
              ) : (
                orders.map((order) => {
                  const subtotal = Number(order.subtotal);
                  const tax = Number(order.tax_total);
                  const gross = Number(order.total);
                  const fees = Number(order.metadata?.payment_gateway_fee);
                  const feesCurrency: string | undefined = order.metadata
                    ?.payment_gateway_currency as string | undefined;

                  return (
                    <Table.Row key={order.id}>
                      <Table.Cell>
                        {order.display_id ? `#${order.display_id}` : order.id}
                      </Table.Cell>
                      <Table.Cell>
                        {formatDate(order.created_at.toString())}
                      </Table.Cell>
                      <Table.Cell>
                        {order.shipping_address?.country_code?.toUpperCase() ||
                          "N/A"}
                      </Table.Cell>
                      <Table.Cell>
                        {formatMoney(subtotal, order.currency_code)}
                      </Table.Cell>
                      <Table.Cell>
                        {formatMoney(tax, order.currency_code)}
                      </Table.Cell>
                      <Table.Cell>
                        {formatMoney(gross, order.currency_code)}
                      </Table.Cell>
                      <Table.Cell>
                        {fees ? `${formatMoney(fees, feesCurrency)}` : "N/A"}
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              )}
            </Table.Body>
          </Table>
          <Table.Pagination
            count={orders.length}
            pageSize={pageSize}
            pageIndex={pageIndex}
            pageCount={orders.length}
            canPreviousPage={canPreviousPage}
            canNextPage={canNextPage}
            previousPage={() => handlePageChange(pageIndex - 1)}
            nextPage={() => handlePageChange(pageIndex + 1)}
          />
        </div>
      )}
    </>
  );
};
export default OrdersTable;
