import { Badge, Select, Text } from "@medusajs/ui";
import { ALLOWED_CURRENCIES, CurrencySelector } from "../../../../types";
import { useDashboardFilters } from "../../../providers/dashboard-filter-context";

const CurrencySelectorComponent = () => {
  const { filters, setFilters } = useDashboardFilters();
  return (
    <div className="flex items-center md:flex-row flex-col gap-2">
      <Text size="small" className="text-ui-fg-subtle">
        Currency
      </Text>
      <Select
        value={filters.currency}
        onValueChange={(value: CurrencySelector) =>
          setFilters({ currency: value })
        }
      >
        <Select.Trigger className="w-[180px]">
          <Select.Value placeholder="Select currency" />
        </Select.Trigger>
        <Select.Content>
          {ALLOWED_CURRENCIES.map((c) => (
            <Select.Item key={c} value={c}>
              {c === "original" ? "Original" : c.toUpperCase()}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
      <Badge color="green">
        {filters.currency === "original"
          ? "Original prices"
          : `Converted to ${filters.currency.toUpperCase()}`}
      </Badge>
    </div>
  );
};
export default CurrencySelectorComponent;
