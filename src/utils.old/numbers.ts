export const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const createIntegerFormatter = (options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
    ...options,
  });

export const formatInteger = (
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions
) => createIntegerFormatter(options).format(value ?? 0);
