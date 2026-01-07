import {
  DataTable,
  useDataTable,
  createDataTableColumnHelper,
  createDataTableFilterHelper,
  DataTableFilteringState,
  DataTableSortingState,
  Heading,
} from "@medusajs/ui";
import { useDashboardData } from "../../../providers/dashboard-data-context";
type OrderRow = {
  id: string;
  display_id?: number;
  created_at: string;
  shipping_address?: {
    country_code?: string | null;
  } | null;
  currency_code: string;
  subtotal: number;
  tax_total: number;
  total: number;
  metadata?: {
    payment_gateway_fee?: number;
    payment_gateway_currency?: string;
  } | null;
};

type Props = {
  orders: OrderRow[];
};

const columnHelper = createDataTableColumnHelper<OrderRow>();
const columns = [
  columnHelper.accessor("display_id", {
    header: "Order ID",
    enableSorting: true,
    sortLabel: "Order ID",
    cell: ({ row }) =>
      row.original.display_id ? `#${row.original.display_id}` : row.original.id,
  }),
  columnHelper.accessor("created_at", {
    header: "Date",
    enableSorting: true,
    sortLabel: "Date",
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString("en-CA"),
  }),
  columnHelper.accessor("shipping_address.country_code", {
    header: "Country",
    cell: ({ row }) =>
      row.original.shipping_address?.country_code?.toUpperCase() || "N/A",
  }),
  columnHelper.accessor("subtotal", {
    header: "Subtotal (before tax)",
    enableSorting: true,
    sortLabel: "Subtotal",
    cell: ({ row }) => `${row.original.subtotal} ${row.original.currency_code}`,
  }),
  columnHelper.accessor("tax_total", {
    header: "Customer Tax",
    enableSorting: true,
    sortLabel: "Tax",
    cell: ({ row }) =>
      `${row.original.tax_total} ${row.original.currency_code}`,
  }),
  columnHelper.accessor("total", {
    header: "Gross",
    enableSorting: true,
    sortLabel: "Gross",
    cell: ({ row }) => `${row.original.total} ${row.original.currency_code}`,
  }),
  columnHelper.accessor("metadata.payment_gateway_fee", {
    header: "Payment Gateway Fees",
    cell: ({ row }) => {
      const fees = row.original.metadata?.payment_gateway_fee;
      const currency = row.original.metadata?.payment_gateway_currency;
      return fees ? `${fees} ${currency?.toUpperCase() || ""}`.trim() : "N/A";
    },
  }),
];

// Filters: by country (select) and by created_at (date range)
const filterHelper = createDataTableFilterHelper<OrderRow>();
const filters = [
  filterHelper.accessor("shipping_address.country_code", {
    type: "select",
    label: "Country",
    options: [
      // You can also generate options dynamically from data if needed.
      { label: "United States", value: "us" },
      { label: "Canada", value: "ca" },
      { label: "Germany", value: "de" },
    ],
  }),
  filterHelper.accessor("created_at", {
    type: "date",
    label: "Date",
    format: "date",
    rangeOptionStartLabel: "From",
    rangeOptionEndLabel: "To",
    rangeOptionLabel: "Between",
    options: [
      {
        label: "Today",
        value: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        },
      },
      {
        label: "This Week",
        value: {
          $gte: new Date(
            new Date().setDate(new Date().getDate() - new Date().getDay())
          ).toISOString(),
        },
      },
      {
        label: "This Month",
        value: {
          $gte: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ).toISOString(),
        },
      },
      {
        label: "This Year",
        value: {
          $gte: new Date(new Date().getFullYear(), 0, 1).toISOString(),
        },
      },
    ],
  }),
];

const OrdersTable = () => {
  const { data } = useDashboardData();

  const orders = data?.orders?.orders || [];

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-left text-sm">
          <thead className="border-b border-ui-border-base bg-ui-bg-field">
            <tr>
              <th className="px-3 py-2 font-semibold">Order ID</th>
              <th className="px-3 py-2 font-semibold">Date</th>
              <th className="px-3 py-2 font-semibold">Country</th>
              <th className="px-3 py-2 font-semibold">Subtotal (before tax)</th>
              <th className="px-3 py-2 font-semibold">Customer Tax</th>
              <th className="px-3 py-2 font-semibold">Gross</th>
              <th className="px-3 py-2 font-semibold">Payment Gateway Fees</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-ui-fg-subtle" colSpan={8}>
                  {"No orders found"}
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const subtotal = order.subtotal;
                const tax = order.tax_total;
                const gross = order.total;
                const fees = order.metadata?.payment_gateway_fee;
                const feesCurrency: string | undefined = order.metadata
                  ?.payment_gateway_currency as string | undefined;

                return (
                  <tr
                    key={order.id}
                    className="border-b border-ui-border-base last:border-0"
                  >
                    <td className="px-3 py-3 font-medium">
                      {order.display_id ? `#${order.display_id}` : order.id}
                    </td>
                    <td className="px-3 py-3">
                      {new Date(order.created_at).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-3 py-3">
                      {order.shipping_address?.country_code?.toUpperCase() ||
                        "N/A"}
                    </td>
                    <td className="px-3 py-3">
                      {subtotal.toString()} {order.currency_code}
                    </td>
                    <td className="px-3 py-3">
                      {tax.toString()} {order.currency_code}
                    </td>
                    <td className="px-3 py-3">
                      {gross.toString()} {order.currency_code}
                    </td>
                    <td className="px-3 py-3">
                      {fees ? `${fees} ${feesCurrency?.toUpperCase()}` : "N/A"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
export default OrdersTable;
