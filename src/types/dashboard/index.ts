import OrdersTab from "../../admin/modules/orders/templates//OrdersTab";
import ProductTab from "../../admin/modules/products/templates/ProductTab";
import CustomersTab from "../../admin/modules/customers/templates/CustomersTab";

const VIEWS = {
  orders: { label: "Orders", component: OrdersTab },
  products: { label: "Products", component: ProductTab },
  customers: { label: "Customers", component: CustomersTab },
} as const;

type TabViews = keyof typeof VIEWS;

export { TabViews, VIEWS };
