import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading } from "@medusajs/ui";
import { ChartBar } from "@medusajs/icons";

const AnalyticsPage = () => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Analytics Dashboard 5</Heading>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Analytics",
  icon: ChartBar,
  rank: 4,
});

export default AnalyticsPage;
