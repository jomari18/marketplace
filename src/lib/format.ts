const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 1500 -> "₱1,500" */
export function formatPrice(value: number): string {
  return peso.format(value);
}

/** "Listed just now", "Listed 3 days ago", ... */
export function formatListedAgo(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  const units: [number, string][] = [
    [60 * 60 * 24 * 365, "year"],
    [60 * 60 * 24 * 30, "month"],
    [60 * 60 * 24 * 7, "week"],
    [60 * 60 * 24, "day"],
    [60 * 60, "hour"],
    [60, "minute"],
  ];
  for (const [size, name] of units) {
    const amount = Math.floor(seconds / size);
    if (amount >= 1) return `Listed ${amount} ${name}${amount === 1 ? "" : "s"} ago`;
  }
  return "Listed just now";
}

/** True if the listing was created in the last 48 hours. */
export function isNew(iso: string, now: number = Date.now()): boolean {
  return now - new Date(iso).getTime() < 48 * 60 * 60 * 1000;
}
