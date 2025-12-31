import { Text, DatePicker, Tabs } from "@medusajs/ui";
import { Preset } from "../../api/admin/analytics/orders/types";
import { useAnalyticsDate } from "../../providers/analytics-date-provider";
import { resolveRange } from "../../utils/date-range";

const PRESETS: Preset[] = [
  "this-month",
  "last-month",
  "last-3-months",
  "custom",
];

const DateInput = () => {
  const { preset, range, setPreset, setRange } = useAnalyticsDate();

  return (
    <div className="flex flex-col gap-2">
      <Text size="small" weight="plus" className="text-ui-fg-subtle">
        Date Range
      </Text>

      <Tabs
        value={preset}
        onValueChange={(p) => {
          const nextPreset = p as Preset;
          setPreset(nextPreset);

          if (nextPreset !== "custom") {
            setRange(resolveRange(nextPreset));
          } else {
            setRange({ from: undefined, to: undefined });
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

      {preset === "custom" && (
        <div className="flex items-end gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <Text size="small" className="text-ui-fg-subtle">
              From
            </Text>
            <DatePicker
              className="w-[160px]"
              value={range.from ? new Date(range.from) : null}
              onChange={(date) => {
                setRange((prev) => ({
                  from: date ? date.toISOString() : undefined,
                  to: prev?.to,
                }));
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Text size="small" className="text-ui-fg-subtle">
              To
            </Text>
            <DatePicker
              className="w-[160px]"
              value={range.to ? new Date(range.to) : null}
              onChange={(date) => {
                setRange((prev) => ({
                  from: prev?.from,
                  to: date ? date.toISOString() : undefined,
                }));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateInput;
