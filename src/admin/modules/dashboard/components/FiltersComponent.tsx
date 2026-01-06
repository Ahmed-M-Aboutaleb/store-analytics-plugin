import { Button, Text } from "@medusajs/ui";
import { useDashboardFilters } from "../../../providers/dashboard-filter-context";
import DateSelector from "./DateSelector";
import PresetSelector from "./PresetSelector";
import CurrencySelectorComponent from "./CurrencySelectorComponent";

const FiltersComponent = () => {
  const { filters } = useDashboardFilters();
  return (
    <div className="flex flex-col gap-4 md:gap-2">
      <div className="flex flex-col gap-4 md:gap-2 justify-center md:flex-row md:items-center md:justify-between">
        <Text size="small" weight="plus" className="text-ui-fg-subtle">
          Date Range
        </Text>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-3">
          <CurrencySelectorComponent />
          <div className="flex justify-center items-center gap-4 md:gap-2">
            <Button size="small" variant="secondary" onClick={() => {}}>
              {false ? "Copied" : "Share link"}
            </Button>
          </div>
        </div>
      </div>
      <PresetSelector />
      {filters.dateRange.preset === "custom" && (
        <div className="flex flex-col md:flex-row md:items-end items-start gap-4 mt-2">
          <DateSelector />
        </div>
      )}
    </div>
  );
};

export default FiltersComponent;
