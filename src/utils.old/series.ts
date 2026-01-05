import { SeriesPoint } from "../types";

export const mapToSeries = (collection: Map<string, number>): SeriesPoint[] =>
  Array.from(collection.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, value]) => ({ date, value }));
