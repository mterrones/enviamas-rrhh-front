export type AttendanceTimeFieldKind = "valid" | "empty_complete" | "invalid_partial";

const DASH_SEGMENT = /^[\u002D\u2013\u2014\u2212]+$/;

export function classifyAttendanceTimeInput(raw: string): AttendanceTimeFieldKind {
  const s = raw.trim();
  if (s === "") return "empty_complete";

  const parts = s.split(":");
  if (parts.length !== 2) return "invalid_partial";

  const hs = parts[0];
  const ms = parts[1];
  const hasDigit = /\d/.test(s);

  if (!hasDigit) {
    if (hs !== "" && ms !== "" && DASH_SEGMENT.test(hs) && DASH_SEGMENT.test(ms)) {
      return "empty_complete";
    }
    return "invalid_partial";
  }

  if (/[^\d:]/.test(s)) return "invalid_partial";
  if (hs === "" || ms === "") return "invalid_partial";
  if (!/^\d{1,2}$/.test(hs) || !/^\d{2}$/.test(ms)) return "invalid_partial";

  const h = Number(hs);
  const m = Number(ms);
  if (Number.isNaN(h) || Number.isNaN(m)) return "invalid_partial";
  if (h < 0 || h > 23 || m < 0 || m > 59) return "invalid_partial";

  return "valid";
}

export function attendanceTimeToMinutes(raw: string): number | null {
  if (classifyAttendanceTimeInput(raw) !== "valid") return null;
  const s = raw.trim();
  const [hs, ms] = s.split(":");
  return Number(hs) * 60 + Number(ms);
}

export function attendanceTimeToApiNullable(raw: string): string | null {
  const kind = classifyAttendanceTimeInput(raw);
  if (kind === "empty_complete") return null;
  if (kind === "valid") return raw.trim();
  return null;
}
