export function formatRinggitFromSen(amountSen: number): string {
  if (!Number.isInteger(amountSen)) {
    throw new TypeError("Currency values must be stored as integer sen.");
  }

  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amountSen / 100)
    .replace(/^MYR\s*/, "RM");
}
