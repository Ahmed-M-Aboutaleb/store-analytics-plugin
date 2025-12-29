import { Text, DatePicker, Tabs } from "@medusajs/ui";
import { Preset } from "../../api/admin/analytics/orders/types";
import { DateRange } from "../types/index";

type DateInputProps = {
  value: DateRange;
  preset: Preset;
  onChange: (range: DateRange) => void;
  onPresetChange: (preset: Preset) => void;
};

const PRESETS: Preset[] = [
  "this-month",
  "last-month",
  "last-3-months",
  "custom",
];

const getPresetDateRange = (preset: Preset): DateRange => {
  const now = new Date();
  let from: Date = new Date();
  let to: Date = new Date();

  to.setHours(23, 59, 59, 999);
  switch (preset) {
    case "this-month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      from.setHours(0, 0, 0, 0);
      break;

    case "last-month":
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      from.setHours(0, 0, 0, 0);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
      to.setHours(23, 59, 59, 999);
      break;

    case "last-3-months":
      from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      from.setHours(0, 0, 0, 0);
      break;

    case "custom":
    default:
      from.setHours(0, 0, 0, 0);
      break;
  }

  return { from: from.toISOString(), to: to.toISOString() };
};

const DateInput = ({
  value,
  preset,
  onChange,
  onPresetChange,
}: DateInputProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Text size="small" weight="plus" className="text-ui-fg-subtle">
        Date Range
      </Text>

      {/* Preset tabs */}
      <Tabs
        value={preset}
        onValueChange={(p) => {
          const presetValue = p as Preset;
          onPresetChange(presetValue);
          if (presetValue !== "custom") {
            onChange(getPresetDateRange(presetValue));
          }
        }}
      >
        <Tabs.List className="gap-2">
          {PRESETS.map((p) => (
            <Tabs.Trigger key={p} value={p}>
              {p.replace("-", " ").toUpperCase()}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs>

      {/* Custom date pickers */}
      {preset === "custom" && (
        <div className="flex items-end gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <Text size="small" className="text-ui-fg-subtle">
              From
            </Text>
            <DatePicker
              className="w-[160px]"
              value={value.from ? new Date(value.from) : null}
              onChange={(date) =>
                onChange({
                  from: date ? date.toISOString() : value.from,
                  to: value.to,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <Text size="small" className="text-ui-fg-subtle">
              To
            </Text>
            <DatePicker
              className="w-[160px]"
              value={value.to ? new Date(value.to) : null}
              onChange={(date) =>
                onChange({
                  from: value.from,
                  to: date ? date.toISOString() : value.to,
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateInput;
