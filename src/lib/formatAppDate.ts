import { format, isValid } from "date-fns";

export function formatAppDate(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  if (value instanceof Date) {
    if (!isValid(value)) return "—";
    return format(value, "dd-MM-yyyy");
  }
  const s = String(value).trim();
  if (!s) return "—";
  const head = s.length >= 10 ? s.slice(0, 10) : s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(head)) {
    const d = new Date(`${head}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "—";
    return format(d, "dd-MM-yyyy");
  }
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return "—";
  return format(parsed, "dd-MM-yyyy");
}

export function formatAppDateTime(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd-MM-yyyy HH:mm");
}

export function formatAppMonthYear(month1to12: number, year: number): string {
  const mm = String(month1to12).padStart(2, "0");
  return `${mm}-${year}`;
}
