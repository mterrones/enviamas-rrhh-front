export type DeductionLineDraft = {
  localId: string;
  code: string;
  label: string;
  amount: string;
};

export function newDeductionLine(partial: Partial<Omit<DeductionLineDraft, "localId">> & { localId?: string }): DeductionLineDraft {
  const localId = partial.localId ?? `dl-${globalThis.crypto?.randomUUID?.() ?? String(Date.now())}-${Math.random()}`;
  return {
    localId,
    code: partial.code ?? "other",
    label: partial.label ?? "Otro",
    amount: partial.amount ?? "0",
  };
}

export function sumDeductionLineAmounts(lines: DeductionLineDraft[]): number {
  let s = 0;
  for (const l of lines) {
    const n = Number.parseFloat(String(l.amount).replace(",", "."));
    if (!Number.isNaN(n)) s += n;
  }
  return Math.round(s * 100) / 100;
}

export function deductionLinesFromPayslipMeta(meta: unknown): DeductionLineDraft[] {
  if (!meta || typeof meta !== "object") return [];
  const pb = (meta as Record<string, unknown>).payslip_breakdown;
  if (!pb || typeof pb !== "object") return [];
  const d = (pb as Record<string, unknown>).deductions;
  if (!Array.isArray(d)) return [];
  return d
    .filter((row): row is { code: string; label: string; amount: number } => {
      if (!row || typeof row !== "object") return false;
      const o = row as Record<string, unknown>;
      return typeof o.code === "string" && typeof o.label === "string" && typeof o.amount === "number";
    })
    .map((row) =>
      newDeductionLine({
        code: row.code,
        label: row.label,
        amount: Number.isFinite(row.amount) ? row.amount.toFixed(2) : "0",
      }),
    );
}

export function buildPayslipBreakdownMeta(lines: DeductionLineDraft[]) {
  if (lines.length === 0) return undefined;
  return {
    payslip_breakdown: {
      schema_version: 1 as const,
      deductions: lines.map((l) => ({
        code: l.code,
        label: l.label,
        amount: Number.parseFloat(String(l.amount).replace(",", ".")) || 0,
      })),
    },
  };
}
