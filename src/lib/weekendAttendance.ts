import type { AttendanceRecord } from "@/api/attendance";

export function recordDateToIsoDay(r: AttendanceRecord): string {
  return r.record_date.length >= 10 ? r.record_date.slice(0, 10) : r.record_date;
}

export function isWeekendYmd(year: number, monthIndex0: number, day: number): boolean {
  const wd = new Date(year, monthIndex0, day).getDay();
  return wd === 0 || wd === 6;
}

export function isWeekendIso(iso: string): boolean {
  if (!iso || iso.length < 10) return false;
  const y = Number(iso.slice(0, 4));
  const mo = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  if (Number.isNaN(y) || Number.isNaN(mo) || Number.isNaN(d)) return false;
  return isWeekendYmd(y, mo - 1, d);
}

export function filterWeekdayAttendanceRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  return records.filter((r) => !isWeekendIso(recordDateToIsoDay(r)));
}
