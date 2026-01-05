import generateStableColor from "./generate-stable-color";

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

export default generateColorsForData;
