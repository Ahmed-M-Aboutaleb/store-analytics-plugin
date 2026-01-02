export const parseStripeFees = (metadata?: Record<string, unknown> | null) => {
  const raw =
    metadata?.stripe_fee_amount ??
    metadata?.stripe_fee ??
    metadata?.stripe_fees;

  if (typeof raw === "number") {
    return raw;
  }
  if (typeof raw === "string" && raw.trim().length) {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const parseStripeFeeCurrency = (
  metadata?: Record<string, unknown> | null
) => {
  const raw =
    metadata?.stripe_fee_currency ??
    metadata?.stripe_currency ??
    metadata?.stripe_fees_currency;
  return typeof raw === "string" ? raw.toUpperCase() : null;
};
