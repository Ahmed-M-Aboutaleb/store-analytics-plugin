import { Tabs } from "@medusajs/ui";
import { useDashboardFilters } from "../../../providers/dashboard-filter-context";
import { Preset, PRESETS } from "../../../../types";

const PresetSelector = () => {
  const { filters, setFilters } = useDashboardFilters();
  return (
    <Tabs
      value={filters.dateRange.preset}
      onValueChange={(p) => {
        setFilters({
          dateRange: { ...filters.dateRange, preset: p as Preset },
        });
      }}
    >
      <Tabs.List className="gap-2 flex-col md:flex-row">
        {PRESETS.map((p) => (
          <Tabs.Trigger className="capitalize" key={p} value={p}>
            {p.replace(/-/g, " ")}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs>
  );
};

export default PresetSelector;
