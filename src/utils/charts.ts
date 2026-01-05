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

export { generateStableColor, generateColorsForData };
