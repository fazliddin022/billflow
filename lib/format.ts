const RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.09,
  UZS: 1 / 12500,
  RUB: 1 / 90,
};

export const toUSD = (amount: number, currency: string) =>
  amount * (RATES_TO_USD[currency] ?? 1);

export function formatMoney(amount: number, currency: string = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "UZS" || currency === "RUB" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300" },
  sent: { label: "Sent", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" },
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400" },
};