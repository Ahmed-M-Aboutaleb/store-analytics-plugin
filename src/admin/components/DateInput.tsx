import { useEffect, useMemo, useState } from "react";
import { Text, DatePicker, Tabs, Button } from "@medusajs/ui";
import { Preset } from "../../api/admin/analytics/orders/types";
import { useAnalyticsDate } from "../providers/analytics-date-provider";
import {
  resolveRange,
  startOfUTC,
  endOfUTC,
  asDateISOString,
} from "../../utils/date-range";

const PRESETS: Preset[] = [
  "this-month",
  "last-month",
  "last-3-months",
  "custom",
];

const formatPresetLabel = (preset: Preset): string => {
  return preset
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const DateInput = () => {
  const { preset, range, setPreset, setRange } = useAnalyticsDate();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timeout);
  }, [copied]);

  const toLocalCalendarDate = (iso?: string) => {
    if (!iso) return null;
    const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const shareUrl = useMemo(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("preset", preset);

    if (preset === "custom" && range.from && range.to) {
      url.searchParams.set("from", range.from);
      url.searchParams.set("to", range.to);
    } else {
      url.searchParams.delete("from");
      url.searchParams.delete("to");
    }

    return url.toString();
  }, [preset, range.from, range.to]);

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch (err) {
      console.error("Failed to copy share link", err);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Text size="small" weight="plus" className="text-ui-fg-subtle">
          Date Range
        </Text>
        <div className="flex items-center gap-2">
          <Button size="small" variant="secondary" onClick={handleCopyShareLink}>
            {copied ? "Copied" : "Share link"}
          </Button>
        </div>
      </div>

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
        <Tabs.List className="gap-2 flex-col md:flex-row">
          {PRESETS.map((p) => (
            <Tabs.Trigger key={p} value={p}>
              {formatPresetLabel(p)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs>

      {preset === "custom" && (
        <div className="flex flex-col md:flex-row md:items-end items-start gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <Text size="small" className="text-ui-fg-subtle">
              From
            </Text>
            <DatePicker
              className="w-[160px]"
              value={toLocalCalendarDate(range.from)}
              onChange={(date) => {
                setRange((prev) => ({
                  from: date ? asDateISOString(startOfUTC(date)) : undefined,
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
              value={toLocalCalendarDate(range.to)}
              onChange={(date) => {
                setRange((prev) => ({
                  from: prev?.from,
                  to: date ? asDateISOString(endOfUTC(date)) : undefined,
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
