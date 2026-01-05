import { Preset, ResolvedRange } from "../types";

export const getStartOfDayUTC = (date: Date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const getEndOfDayUTC = (date: Date) => {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

export const getMonthRange = (baseDate: Date, offset: number) => {
  const year = baseDate.getUTCFullYear();
  const targetMonth = baseDate.getUTCMonth() + offset;

  const start = new Date(Date.UTC(year, targetMonth, 1));
  const end = new Date(Date.UTC(year, targetMonth + 1, 0));

  return {
    from: getStartOfDayUTC(start),
    to: getEndOfDayUTC(end),
  };
};

export const resolveRange = (
  preset: Preset,
  from?: string,
  to?: string
): ResolvedRange => {
  const today = new Date();

  switch (preset) {
    case "this-month": {
      const { from: f, to: t } = getMonthRange(today, 0);
      return { preset, from: f.toISOString(), to: t.toISOString() };
    }

    case "last-month": {
      const { from: f, to: t } = getMonthRange(today, -1);
      return { preset, from: f.toISOString(), to: t.toISOString() };
    }

    case "last-3-months": {
      // Start: 1st day of month, 2 months ago
      const start = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 2, 1)
      );
      // End: Last day of current month
      const end = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)
      );

      return {
        preset,
        from: getStartOfDayUTC(start).toISOString(),
        to: getEndOfDayUTC(end).toISOString(),
      };
    }

    case "custom": {
      if (!from || !to) {
        throw new Error("Custom preset requires both 'from' and 'to' dates");
      }

      return {
        preset,
        from: getStartOfDayUTC(new Date(from)).toISOString(),
        to: getEndOfDayUTC(new Date(to)).toISOString(),
      };
    }

    default: {
      throw new Error(`Unsupported preset: ${preset}`);
    }
  }
};
