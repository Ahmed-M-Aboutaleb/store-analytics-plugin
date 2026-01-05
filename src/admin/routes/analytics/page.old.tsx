import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ChartBar } from "@medusajs/icons";
import { Container, Divider, Heading, Tabs, Text } from "@medusajs/ui";
import { useEffect, useMemo, useState } from "react";
import OrdersTab from "../../components.old/OrderTab";
import ProductsTab from "../../components.old/ProductTab";
import Surface from "../../modules/dashboard/components/Surface";
import DateInput from "../../modules/dashboard/components/DateInput.old";
import { AnalyticsDateProvider } from "../../providers/analytics-date-provider.old";
import { GlobalDataProvider } from "../../providers/data-provider.old";

const AnalyticsContent = () => {
  const initialView = useMemo(() => {
    if (typeof window === "undefined") return "orders" as const;
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    return v === "products" ? "products" : "orders";
  }, []);

  const [view, setView] = useState<"orders" | "products">(initialView);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.replaceState(null, "", url.toString());
  }, [view]);

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2" className="text-ui-fg-base">
            Analytics
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Overview of product performance and customer growth.
          </Text>
        </div>
        <ChartBar className="h-5 w-5 text-ui-fg-muted" />
      </div>

      <div className="space-y-5 px-6 py-5">
        <Surface>
          <DateInput view={view} />
        </Surface>

        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
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

const AnalyticsPage = () => {
  return (
    <AnalyticsDateProvider>
      <GlobalDataProvider>
        <AnalyticsContent />
      </GlobalDataProvider>
    </AnalyticsDateProvider>
  );
};

export const config = defineRouteConfig({
  label: "Analytics",
  icon: ChartBar,
  rank: 2,
});

export default AnalyticsPage;
