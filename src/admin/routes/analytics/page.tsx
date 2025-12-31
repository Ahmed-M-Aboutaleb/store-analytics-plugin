import { useState, useEffect } from "react";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ChartBar } from "@medusajs/icons";
import { Container, Divider, Heading, Tabs, Text } from "@medusajs/ui";
import OrdersTab from "../../components/OrderTab";
import ProductsTab from "../../components/ProductTab";
import Surface from "../../components/Surface";
import DateInput from "../../components/DateInput";
import {
  AnalyticsDateProvider,
  useAnalyticsDate,
} from "../../../providers/analytics-date-provider"; // provider + hook

const AnalyticsContent = () => {
  const { preset, range } = useAnalyticsDate();

  useEffect(() => {
    if (preset === "custom" && (!range.from || !range.to)) {
      return;
    }
    const fetchAnalytics = async () => {
      if (preset === "custom" && (!range.from || !range.to)) return;

      const params = new URLSearchParams();
      params.set("preset", preset);
      if (preset === "custom") {
        params.set("from", range.from!);
        params.set("to", range.to!);
      }

      try {
        const res = await fetch(`/admin/analytics/orders?${params.toString()}`);
        const json = await res.json();
        console.log(json);
        // setData(json);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      }
    };

    fetchAnalytics();
  }, [preset, range.from, range.to]);

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
          <DateInput />
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

const AnalyticsPage = () => {
  return (
    <AnalyticsDateProvider>
      <AnalyticsContent />
    </AnalyticsDateProvider>
  );
};

export const config = defineRouteConfig({
  label: "Analytics",
  icon: ChartBar,
  rank: 2,
});

export default AnalyticsPage;
