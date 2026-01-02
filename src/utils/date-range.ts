import { FilterableOrderProps } from "@medusajs/types";
import { Preset, ResolvedRange } from "../api/admin/analytics/orders/types";

export const asDateISOString = (value: Date) => value.toISOString();

export const startOfUTC = (date: Date) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );

export const endOfUTC = (date: Date) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );

export const getMonthRange = (today: Date, offset: number) => {
  const start = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1)
  );
  const end = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset + 1, 0)
  );
  return {
    from: startOfUTC(start),
    to: endOfUTC(end),
  };
};

export const resolveRange = (
  preset: Preset,
  from?: string,
  to?: string,
  additionalOffset = false
): ResolvedRange => {
  const today = new Date();
  switch (preset) {
    case "this-month": {
      const { from: f, to: t } = getMonthRange(today, 0);
      return { preset, from: asDateISOString(f), to: asDateISOString(t) };
    }
    case "last-month": {
      const { from: f, to: t } = getMonthRange(today, -1);
      return { preset, from: asDateISOString(f), to: asDateISOString(t) };
    }
    case "last-3-months": {
      const start = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 2, 1)
      );
      const end = endOfUTC(
        new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0))
      );
      return {
        preset,
        from: asDateISOString(startOfUTC(start)),
        to: additionalOffset
          ? asDateISOString(end)
          : asDateISOString(endOfUTC(end)),
      };
    }
    case "custom": {
      if (!from || !to) {
        throw new Error("Custom preset requires both 'from' and 'to'");
      }
      console.log("Logs(date-range: resolveRange): from, to", {
        from,
        to,
      });
      return {
        preset,
        from: asDateISOString(startOfUTC(new Date(from))),
        to: asDateISOString(endOfUTC(new Date(to))),
      };
    }
    default: {
      throw new Error(`Unsupported preset: ${preset}`);
    }
  }
};

export const buildFilters = (range: ResolvedRange): FilterableOrderProps => ({
  created_at: {
    $gte: range.from,
    $lte: range.to,
  } as FilterableOrderProps["created_at"],
});
