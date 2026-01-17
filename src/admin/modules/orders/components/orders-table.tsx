import { Skeleton, Table } from "@medusajs/ui";
import { formatDate } from "../../../../utils/date";
import { formatMoney } from "../../../../utils/money";
import {
  useOrdersTableData,
  TableOrder,
} from "../../../hooks/use-orders-table-data";

const OrdersTable = () => {
  const { orders, count, isLoading, pagination } = useOrdersTableData();

  if (isLoading) {
    return <Skeleton className="h-48 w-full mb-4 rounded-lg" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg overflow-x-auto border border-ui-border-base bg-ui-bg-base overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>#</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Country</Table.HeaderCell>
              <Table.HeaderCell className="text-right">
                Subtotal
              </Table.HeaderCell>
              <Table.HeaderCell className="text-right">Tax</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
              <Table.HeaderCell className="text-right">
                Gateway Fees
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {orders.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-subtle py-8">
                  No orders found
                </Table.Cell>
              </Table.Row>
            ) : (
              orders.map((order) => <OrderRow key={order.id} order={order} />)
            )}
          </Table.Body>
        </Table>
      </div>

      <Table.Pagination
        count={count}
        pageSize={pagination.pageSize}
        pageIndex={pagination.pageIndex}
        pageCount={pagination.pageCount}
        canPreviousPage={pagination.canPreviousPage}
        canNextPage={pagination.canNextPage}
        previousPage={pagination.previousPage}
        nextPage={pagination.nextPage}
      />
    </div>
  );
};

const OrderRow = ({ order }: { order: TableOrder }) => {
  return (
    <Table.Row>
      <Table.Cell>
        {order.display_id ? `#${order.display_id}` : order.id.slice(0, 8)}
      </Table.Cell>
      <Table.Cell>{formatDate(order.created_at.toString())}</Table.Cell>
      <Table.Cell>{order.country_code}</Table.Cell>
      <Table.Cell className="text-right">
        {formatMoney(order.subtotal, order.currency_code)}
      </Table.Cell>
      <Table.Cell className="text-right">
        {formatMoney(order.tax_total, order.currency_code)}
      </Table.Cell>
      <Table.Cell className="text-right font-medium">
        {formatMoney(order.total, order.currency_code)}
      </Table.Cell>
      <Table.Cell className="text-right text-ui-fg-subtle">
        {order.payment_gateway_fee
          ? formatMoney(
              order.payment_gateway_fee,
              order.payment_gateway_currency || order.currency_code
            )
          : "-"}
      </Table.Cell>
    </Table.Row>
  );
};

export default OrdersTable;
