import { DatePicker, Text } from "@medusajs/ui";
import { useState } from "react";
import { useDashboardFilters } from "../../../providers/dashboard-filter-context";
import { enforceUTCDate } from "../../../../utils/date";

const DateSelector = ({ className }: { className?: string }) => {
  const { filters, setFilters } = useDashboardFilters();
  const [to, setTo] = useState<Date | null>(new Date());
  const [from, setFrom] = useState<Date | null>(new Date());
  const handleDateChange = (type: "from" | "to", date: Date | null) => {
    if (type === "from") setFrom(date);
    else setTo(date);
    if (!date) return;
    setFilters({
      dateRange: {
        preset: "custom",
        from: type === "from" ? enforceUTCDate(date) : filters.dateRange.from,
        to: type === "to" ? enforceUTCDate(date) : filters.dateRange.to,
      },
    });
  };
  return (
    <div className={className}>
      <div className="flex flex-col gap-1">
        <Text size="small" className="text-ui-fg-subtle">
          From
        </Text>
        <DatePicker
          className="w-[160px]"
          value={from}
          onChange={(date) => {
            handleDateChange("from", date);
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Text size="small" className="text-ui-fg-subtle">
          To
        </Text>
        <DatePicker
          className="w-[160px]"
          value={to}
          onChange={(date) => {
            handleDateChange("to", date);
          }}
        />
      </div>
    </div>
  );
};

export default DateSelector;
