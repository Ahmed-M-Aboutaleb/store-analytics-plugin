import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  ALLOWED_CURRENCIES,
  CurrencySelector,
  Preset,
  PRESETS,
  ResolvedRange,
} from "../../types";
import { resolveRange } from "../../utils/date-range";

type AnalyticsDateContextValue = {
  range: ResolvedRange;
  currency: CurrencySelector;
  setRange: React.Dispatch<React.SetStateAction<ResolvedRange>>;
  setCurrency: React.Dispatch<React.SetStateAction<CurrencySelector>>;
};

const AnalyticsDateContext = createContext<AnalyticsDateContextValue | null>(
  null
);

export const AnalyticsDateProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [range, setRange] = useState<ResolvedRange>(() =>
    resolveRange("this-month")
  );
  const [currency, setCurrency] = useState<CurrencySelector>("original");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const presetParam = params.get("preset") as Preset | null;
    const fromParam = params.get("from");
    const toParam = params.get("to");
    const currencyParam = params.get("currency") as CurrencySelector | null;

    if (currencyParam && ALLOWED_CURRENCIES.includes(currencyParam)) {
      setCurrency(currencyParam);
    }

    if (!presetParam || !PRESETS.includes(presetParam)) {
      return;
    }

    if (presetParam !== "custom") {
      setRange(resolveRange(presetParam));
      return;
    }

    if (!fromParam || !toParam) {
      return;
    }

    try {
      const resolved = resolveRange("custom", fromParam, toParam);
      setRange(resolved);
    } catch (err) {
      // Ignore invalid query params and keep defaults
      console.error("Invalid analytics date params", err);
    }
  }, []);

  return (
    <AnalyticsDateContext.Provider
      value={{ range, setRange, currency, setCurrency }}
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
  const { range, setRange, currency, setCurrency } = useAnalyticsDateContext();

  return { range, setRange, currency, setCurrency };
};
