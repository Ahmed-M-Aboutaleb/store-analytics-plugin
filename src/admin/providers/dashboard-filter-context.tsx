import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CurrencySelector, ResolvedRange } from "../../types";
import { resolveRange } from "../../utils/date";

type DashboardFilters = {
  dateRange: ResolvedRange<Date>;
  currency: CurrencySelector;
};

type DashboardFilterContextType = {
  filters: DashboardFilters;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
};

const getDefaultFilters = (): DashboardFilters => ({
  dateRange: resolveRange("this-month"),
  currency: "original",
});

const DashboardFilterContext = createContext<
  DashboardFilterContextType | undefined
>(undefined);

const DashboardFilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFiltersState] = useState<DashboardFilters>(
    getDefaultFilters()
  );

  const setFilters = useCallback((filters: Partial<DashboardFilters>) => {
    setFiltersState((prevFilters) => ({
      ...prevFilters,
      ...filters,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(getDefaultFilters());
  }, []);

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      resetFilters,
    }),
    [filters, setFilters, resetFilters]
  );

  return (
    <DashboardFilterContext.Provider value={value}>
      {children}
    </DashboardFilterContext.Provider>
  );
};

const useDashboardFilters = () => {
  const context = useContext(DashboardFilterContext);
  if (!context) {
    throw new Error(
      "useDashboardFilters must be used within a DashboardFilterProvider"
    );
  }
  return context;
};

export { DashboardFilterProvider, useDashboardFilters };
