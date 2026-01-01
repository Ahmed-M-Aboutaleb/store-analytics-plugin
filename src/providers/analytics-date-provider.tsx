import { createContext, useContext, useState, ReactNode } from "react";
import { DateRange } from "../admin/types";
import { Preset } from "../api/admin/analytics/orders/types";
import { resolveRange } from "../utils/date-range";

type AnalyticsDateContextValue = {
  preset: Preset;
  range: DateRange;
  setPreset: React.Dispatch<React.SetStateAction<Preset>>;
  setRange: React.Dispatch<React.SetStateAction<DateRange>>;
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

  return (
    <AnalyticsDateContext.Provider
      value={{ preset, setPreset, range, setRange }}
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
  const { preset, range, setPreset, setRange } =
    useAnalyticsDateContext();

  return { preset, range, setPreset, setRange };
};
