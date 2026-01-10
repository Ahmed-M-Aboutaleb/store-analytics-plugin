import { SeriesPoint } from "../types";

function generateStableColor(
  input: string,
  saturation = 70,
  lightness = 50
): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  const hue = Math.abs(hash) % 360;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function generateColorsForData<T extends Record<string, any>>(
  data: T[],
  keyField: keyof T,
  saturation = 70,
  lightness = 50
): string[] {
  return data.map((item) =>
    generateStableColor(String(item[keyField]), saturation, lightness)
  );
}

const transformSalesForChart = (salesData: Record<string, SeriesPoint[]>) => {
  const chartDataMap = new Map<string, Record<string, string | number>>();
  const currencies = Object.keys(salesData);

  currencies.forEach((currency) => {
    const points = salesData[currency];
    points.forEach((point) => {
      const dayEntry = chartDataMap.get(point.date) || { date: point.date };
      dayEntry[currency] = point.value;

      chartDataMap.set(point.date, dayEntry);
    });
  });
  return Array.from(chartDataMap.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );
};

export { generateStableColor, generateColorsForData, transformSalesForChart };
