import { describe, expect, it } from "vitest";
import {
  attendanceTimeToApiNullable,
  attendanceTimeToMinutes,
  classifyAttendanceTimeInput,
  type AttendanceTimeFieldKind,
} from "./attendanceTimeInput";

function expectKind(raw: string, kind: AttendanceTimeFieldKind): void {
  expect(classifyAttendanceTimeInput(raw)).toBe(kind);
}

describe("classifyAttendanceTimeInput", () => {
  it("empty_complete: blank or full dash placeholder --:--", () => {
    expectKind("", "empty_complete");
    expectKind("   ", "empty_complete");
    expectKind("--:--", "empty_complete");
    expectKind("\u2013\u2013:\u2013\u2013", "empty_complete");
    expectKind("\u2212\u2212:\u2212\u2212", "empty_complete");
  });

  it("valid: strict HH:MM", () => {
    expectKind("09:00", "valid");
    expectKind("9:05", "valid");
    expectKind("23:59", "valid");
    expectKind("00:00", "valid");
    expectKind("18:45", "valid");
  });

  it("invalid_partial: any partial dash pattern with digits or mixed", () => {
    expectKind("09:--", "invalid_partial");
    expectKind("--:45", "invalid_partial");
    expectKind("--:00", "invalid_partial");
    expectKind("18:--", "invalid_partial");
    expectKind("0:--", "invalid_partial");
    expectKind("--:5", "invalid_partial");
    expectKind("09:\u2013\u2013", "invalid_partial");
    expectKind("\u2212\u2212:45", "invalid_partial");
    expectKind("\u2013\u2013:00", "invalid_partial");
  });

  it("invalid_partial: incomplete numeric", () => {
    expectKind("9:5", "invalid_partial");
    expectKind("12:", "invalid_partial");
    expectKind(":30", "invalid_partial");
    expectKind("12:3", "invalid_partial");
  });

  it("invalid_partial: out of range", () => {
    expectKind("24:00", "invalid_partial");
    expectKind("09:60", "invalid_partial");
  });

  it("invalid_partial: no digits but not both dash segments", () => {
    expectKind("--:", "invalid_partial");
    expectKind(":--", "invalid_partial");
    expectKind("abc:def", "invalid_partial");
  });
});

describe("pair rules (documented behaviour)", () => {
  function pairCase(a: string, b: string): { invalid: boolean; faltaPath: boolean; bothValid: boolean } {
    const ka = classifyAttendanceTimeInput(a);
    const kb = classifyAttendanceTimeInput(b);
    if (ka === "invalid_partial" || kb === "invalid_partial") {
      return { invalid: true, faltaPath: false, bothValid: false };
    }
    if (ka === "empty_complete" && kb === "empty_complete") {
      return { invalid: false, faltaPath: true, bothValid: false };
    }
    if (ka === "valid" && kb === "valid") {
      return { invalid: false, faltaPath: false, bothValid: true };
    }
    return { invalid: true, faltaPath: false, bothValid: false };
  }

  it("allows only both empty_complete or both valid", () => {
    expect(pairCase("", "")).toEqual({ invalid: false, faltaPath: true, bothValid: false });
    expect(pairCase("--:--", "--:--")).toEqual({ invalid: false, faltaPath: true, bothValid: false });
    expect(pairCase("", "--:--")).toEqual({ invalid: false, faltaPath: true, bothValid: false });

    expect(pairCase("09:00", "18:45")).toEqual({ invalid: false, faltaPath: false, bothValid: true });

    expect(pairCase("--:00", "18:45")).toEqual({ invalid: true, faltaPath: false, bothValid: false });
    expect(pairCase("09:--", "18:45")).toEqual({ invalid: true, faltaPath: false, bothValid: false });
    expect(pairCase("09:00", "--:45")).toEqual({ invalid: true, faltaPath: false, bothValid: false });
    expect(pairCase("09:00", "18:--")).toEqual({ invalid: true, faltaPath: false, bothValid: false });
    expect(pairCase("09:--", "--:--")).toEqual({ invalid: true, faltaPath: false, bothValid: false });
    expect(pairCase("--:00", "--:--")).toEqual({ invalid: true, faltaPath: false, bothValid: false });
    expect(pairCase("--:--", "18:--")).toEqual({ invalid: true, faltaPath: false, bothValid: false });
    expect(pairCase("--:--", "--:45")).toEqual({ invalid: true, faltaPath: false, bothValid: false });
    expect(pairCase("--:00", "--:45")).toEqual({ invalid: true, faltaPath: false, bothValid: false });
    expect(pairCase("09:--", "18:--")).toEqual({ invalid: true, faltaPath: false, bothValid: false });
    expect(pairCase("--:00", "18:--")).toEqual({ invalid: true, faltaPath: false, bothValid: false });
    expect(pairCase("09:--", "--:45")).toEqual({ invalid: true, faltaPath: false, bothValid: false });

    expect(pairCase("09:00", "")).toEqual({ invalid: true, faltaPath: false, bothValid: false });
    expect(pairCase("", "18:45")).toEqual({ invalid: true, faltaPath: false, bothValid: false });
  });
});

describe("attendanceTimeToMinutes", () => {
  it("returns minutes only for valid input", () => {
    expect(attendanceTimeToMinutes("09:00")).toBe(9 * 60);
    expect(attendanceTimeToMinutes("18:45")).toBe(18 * 60 + 45);
    expect(attendanceTimeToMinutes("09:--")).toBeNull();
    expect(attendanceTimeToMinutes("--:--")).toBeNull();
    expect(attendanceTimeToMinutes("")).toBeNull();
  });
});

describe("attendanceTimeToApiNullable", () => {
  it("maps empty_complete and valid for API", () => {
    expect(attendanceTimeToApiNullable("")).toBeNull();
    expect(attendanceTimeToApiNullable("--:--")).toBeNull();
    expect(attendanceTimeToApiNullable("09:30")).toBe("09:30");
    expect(attendanceTimeToApiNullable("09:--")).toBeNull();
  });
});
