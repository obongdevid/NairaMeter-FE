/** Kobo (integer) -> "₦1,234.50". */
export function formatNaira(kobo: number): string {
  const sign = kobo < 0 ? "-" : "";
  const abs = Math.abs(kobo);
  const naira = Math.floor(abs / 100).toLocaleString("en-NG");
  const rem = abs % 100;
  return `${sign}₦${naira}${rem ? "." + String(rem).padStart(2, "0") : ""}`;
}

/** Minutes since midnight -> "08:00". */
export function formatMinuteOfDay(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
