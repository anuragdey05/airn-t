const usdCache = new Map<number, Intl.NumberFormat>();

/** Format a USD amount with grouping, e.g. formatUsd(1234.5) → "$1,235", formatUsd(10.5, 2) → "$10.50". */
export function formatUsd(value: number, fractionDigits = 0): string {
  let fmt = usdCache.get(fractionDigits);
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    usdCache.set(fractionDigits, fmt);
  }
  return fmt.format(value);
}
