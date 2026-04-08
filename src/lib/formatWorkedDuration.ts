export function formatDecimalHoursAsDuration(hours: number | string | null | undefined): string {
  if (hours == null || hours === "") return "—";
  const n = typeof hours === "string" ? Number.parseFloat(hours) : hours;
  if (Number.isNaN(n) || n < 0) return "—";
  const totalMinutes = Math.round(n * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0 && m === 0) return "0 h";
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
