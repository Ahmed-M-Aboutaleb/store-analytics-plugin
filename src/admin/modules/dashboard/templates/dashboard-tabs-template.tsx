import { useState } from "react";
import { TabViews, VIEWS } from "../../../../types";
import { Container, Divider, Heading, Tabs, Text } from "@medusajs/ui";
import { ChartBar } from "@medusajs/icons";
import Surface from "../components/Surface";
import FiltersComponent from "../components/FiltersComponent";

const DashboardTabsTemplate = () => {
  const [view, setView] = useState<TabViews>(Object.keys(VIEWS)[0] as TabViews);
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
          <FiltersComponent />
        </Surface>

        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <Tabs.List className="justify-center flex-col sm:flex-row">
            {Object.entries(VIEWS).map(([key, config]) => (
              <Tabs.Trigger key={key} value={key} className="px-4 py-2">
                {config.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Divider className="mt-4 mb-4" />
          {Object.entries(VIEWS).map(([key, _config]) => {
            const Component = _config.component;
            return (
              <Tabs.Content key={key} value={key}>
                <Component />
              </Tabs.Content>
            );
          })}
        </Tabs>
      </div>
    </Container>
  );
};

export default DashboardTabsTemplate;
