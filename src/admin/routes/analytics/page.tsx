import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ChartBar } from "@medusajs/icons";
import { Container, Divider, Heading, Tabs, Text } from "@medusajs/ui";
import OrdersTab from "../../components/OrderTab";
import ProductsTab from "../../components/ProductTab";
import Surface from "../../components/Surface";

const AnalyticsPage = () => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2" className="text-ui-fg-base">
            Analytics
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Overview of product performance and customer growth.{" "}
          </Text>
        </div>
        <ChartBar className="h-5 w-5 text-ui-fg-muted" />
      </div>

      <div className="space-y-5 px-6 py-5">
        <Surface>
          {/* TODO: Date Range Inputs */}
          Date Range Picker with Presets Goes Here
        </Surface>

        <Tabs defaultValue="orders">
          <Tabs.List className="justify-center">
            <Tabs.Trigger value="orders">Orders</Tabs.Trigger>
            <Tabs.Trigger value="products">Products</Tabs.Trigger>
          </Tabs.List>
          <Divider className="mt-4 mb-4" />
          <Tabs.Content value="orders" className="pt-4">
            <OrdersTab />
          </Tabs.Content>

          <Tabs.Content value="products" className="pt-4">
            <ProductsTab />
          </Tabs.Content>
        </Tabs>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Analytics",
  icon: ChartBar,
  rank: 2,
});

export default AnalyticsPage;
