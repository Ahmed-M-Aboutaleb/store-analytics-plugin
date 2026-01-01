import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { DateRange } from "../types";
import {
  CurrencySelector,
  Preset,
  PRESETS,
} from "../../api/admin/analytics/orders/types";
import { resolveRange } from "../../utils/date-range";

type AnalyticsDateContextValue = {
  preset: Preset;
  range: DateRange;
  currency: CurrencySelector;
  setPreset: React.Dispatch<React.SetStateAction<Preset>>;
  setRange: React.Dispatch<React.SetStateAction<DateRange>>;
  setCurrency: React.Dispatch<React.SetStateAction<CurrencySelector>>;
};

const AnalyticsDateContext =
  createContext<AnalyticsDateContextValue | null>(null);

export const AnalyticsDateProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [preset, setPreset] = useState<Preset>("this-month");
  const [range, setRange] = useState<DateRange>(() =>
    resolveRange("this-month")
  );
  const [currency, setCurrency] = useState<CurrencySelector>("original");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const presetParam = params.get("preset") as Preset | null;
    const fromParam = params.get("from");
    const toParam = params.get("to");

    if (!presetParam || !PRESETS.includes(presetParam)) {
      return;
    }

    if (presetParam !== "custom") {
      setPreset(presetParam);
      setRange(resolveRange(presetParam));
      return;
    }

    if (!fromParam || !toParam) {
      return;
    }

    try {
      const resolved = resolveRange("custom", fromParam, toParam);
      setPreset("custom");
      setRange({ from: resolved.from, to: resolved.to });
    } catch (err) {
      // Ignore invalid query params and keep defaults
      console.error("Invalid analytics date params", err);
    }
  }, []);

  return (
    <AnalyticsDateContext.Provider
      value={{ preset, setPreset, range, setRange, currency, setCurrency }}
    >
      {children}
    </AnalyticsDateContext.Provider>
  );
};

export const useAnalyticsDateContext = () => {
  const ctx = useContext(AnalyticsDateContext);
  if (!ctx) {
    throw new Error(
      "useAnalyticsDateContext must be used within AnalyticsDateProvider"
    );
  }
  return ctx;
};

export const useAnalyticsDate = () => {
  const { preset, range, setPreset, setRange, currency, setCurrency } =
    useAnalyticsDateContext();

  return { preset, range, setPreset, setRange, currency, setCurrency };
};
