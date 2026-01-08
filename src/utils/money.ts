const formatMoney = (amount: number, currency?: string | null) => {
  if (!currency) return `${amount}`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
};

export { formatMoney };
