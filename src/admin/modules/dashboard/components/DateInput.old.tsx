import { useEffect, useMemo, useState } from "react";
import { Text, DatePicker, Tabs, Button, Select, Badge } from "@medusajs/ui";
import {
  ALLOWED_CURRENCIES,
  CurrencySelector,
  Preset,
  PRESETS,
} from "../../../../types";
import { useAnalyticsDate } from "../../../providers/analytics-date-provider.old";
import { resolveRange } from "../../../../utils.old/date-range";

const formatPresetLabel = (preset: Preset): string => {
  return preset
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const toTitle = (value: string): string =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

type View = "orders" | "products";

const DateInput = ({ view }: { view: View }) => {
  const { range, setRange, currency, setCurrency } = useAnalyticsDate();
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

  const toUtcStartIso = (date: Date) =>
    new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
    ).toISOString();

  const toUtcEndIso = (date: Date) =>
    new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
        999
      )
    ).toISOString();

  const shareUrl = useMemo(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("preset", range.preset);
    url.searchParams.set("currency", currency);
    url.searchParams.set("view", view);

    if (range.preset === "custom" && range.from && range.to) {
      url.searchParams.set("from", range.from.toString());
      url.searchParams.set("to", range.to.toString());
    } else {
      url.searchParams.delete("from");
      url.searchParams.delete("to");
    }

    return url.toString();
  }, [range.preset, range.from, range.to, currency, view]);

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
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Text size="small" weight="plus" className="text-ui-fg-subtle">
          Date Range
        </Text>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <div className="flex items-center gap-2">
            <Text size="small" className="text-ui-fg-subtle">
              Currency
            </Text>
            <Select
              value={currency}
              onValueChange={(value) => setCurrency(value as CurrencySelector)}
            >
              <Select.Trigger className="w-[180px]">
                <Select.Value placeholder="Select currency" />
              </Select.Trigger>
              <Select.Content>
                {ALLOWED_CURRENCIES.map((c) => (
                  <Select.Item key={c} value={c}>
                    {toTitle(c)}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
            <Badge color="green">
              {currency === "original"
                ? "Original prices"
                : `Converted to ${toTitle(currency)}`}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              variant="secondary"
              onClick={handleCopyShareLink}
            >
              {copied ? "Copied" : "Share link"}
            </Button>
          </div>
        </div>
      </div>

      <Tabs
        value={range.preset}
        onValueChange={(p) => {
          const nextPreset = p as Preset;
          setRange((prev) => ({
            ...prev,
            preset: nextPreset,
          }));

          if (nextPreset !== "custom") {
            setRange(resolveRange(nextPreset));
          } else {
            setRange({
              from: undefined as unknown as string,
              to: undefined as unknown as string,
              preset: "custom",
            });
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

      {range.preset === "custom" && (
        <div className="flex flex-col md:flex-row md:items-end items-start gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <Text size="small" className="text-ui-fg-subtle">
              From
            </Text>
            <DatePicker
              className="w-[160px]"
              value={toLocalCalendarDate(range.from.toString())}
              onChange={(date) => {
                setRange((prev) => ({
                  from: toUtcStartIso(date as Date),
                  to: prev?.to,
                  preset: "custom",
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
              value={toLocalCalendarDate(range.to.toString())}
              onChange={(date) => {
                setRange((prev) => ({
                  from: prev?.from,
                  to: toUtcEndIso(date as Date),
                  preset: "custom",
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
