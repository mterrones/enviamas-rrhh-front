import type { components } from "@/api/contracts";
import { AGGREGATION_PAGE_SIZE } from "@/constants/pagination";
import { apiRequest } from "@/api/client";
import { downloadReportPdf, downloadReportXlsx, downloadReportZip } from "@/api/reportExports";

export type PayrollPeriod = components["schemas"]["PayrollPeriod"];
export type Payslip = components["schemas"]["Payslip"];
export type PrevisionalPreviewData = components["schemas"]["PrevisionalPreviewData"];

export type PayslipListParams = {
  page?: number;
  per_page?: number;
  payroll_period_id?: number;
  employee_id?: number;
};

function buildPayslipsQuery(params: PayslipListParams): string {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.per_page != null) q.set("per_page", String(params.per_page));
  if (params.payroll_period_id != null) q.set("payroll_period_id", String(params.payroll_period_id));
  if (params.employee_id != null) q.set("employee_id", String(params.employee_id));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchPayrollPeriods() {
  return apiRequest<components["schemas"]["PayrollPeriodListEnvelope"]>("/payroll-periods");
}

export type PayrollPeriodCreateBody = components["schemas"]["PayrollPeriodWrite"];

export async function createPayrollPeriod(body: PayrollPeriodCreateBody) {
  return apiRequest<components["schemas"]["PayrollPeriodEnvelope"]>("/payroll-periods", {
    method: "POST",
    body,
  });
}

export async function fetchPayslipsPage(params: PayslipListParams = {}) {
  return apiRequest<components["schemas"]["PayslipPaginatedEnvelope"]>(`/payslips${buildPayslipsQuery(params)}`);
}

export async function fetchAllPayslipsForPeriod(payroll_period_id: number): Promise<Payslip[]> {
  const per_page = AGGREGATION_PAGE_SIZE;
  const first = await fetchPayslipsPage({ payroll_period_id, page: 1, per_page });
  const out = [...first.data];
  const lastPage = first.meta.last_page ?? 1;
  for (let p = 2; p <= lastPage; p++) {
    const r = await fetchPayslipsPage({ payroll_period_id, page: p, per_page });
    out.push(...r.data);
  }
  return out;
}

export async function fetchAllPayslipsForEmployee(employeeId: number): Promise<Payslip[]> {
  const per_page = AGGREGATION_PAGE_SIZE;
  const first = await fetchPayslipsPage({ employee_id: employeeId, page: 1, per_page });
  const out = [...first.data];
  const lastPage = first.meta.last_page ?? 1;
  for (let p = 2; p <= lastPage; p++) {
    const r = await fetchPayslipsPage({ employee_id: employeeId, page: p, per_page });
    out.push(...r.data);
  }
  return out;
}

export type PrevisionalPreviewBody = components["schemas"]["PrevisionalPreviewWrite"];

export async function fetchPrevisionalPreview(body: PrevisionalPreviewBody) {
  return apiRequest<components["schemas"]["PrevisionalPreviewEnvelope"]>("/payslips/preview-previsional", {
    method: "POST",
    body,
  });
}

export type PayslipCreateBody = components["schemas"]["PayslipWrite"];

export async function createPayslip(body: PayslipCreateBody) {
  return apiRequest<components["schemas"]["PayslipEnvelope"]>("/payslips", {
    method: "POST",
    body,
  });
}

export type PayslipAmountsPatchBody = components["schemas"]["PayslipAmountsPatch"];

export async function updatePayslip(id: number, body: PayslipAmountsPatchBody) {
  return apiRequest<components["schemas"]["PayslipEnvelope"]>(`/payslips/${id}`, {
    method: "PATCH",
    body,
  });
}

export async function notifyPayslipEmployee(id: number) {
  return apiRequest<components["schemas"]["PayslipNotifyEnvelope"]>(`/payslips/${id}/notify-employee`, {
    method: "POST",
  });
}

export type PayslipNotifyPeriodBody = components["schemas"]["PayslipNotifyPeriodWrite"];

export function buildPayslipNotifyPeriodBody(payrollPeriodId: number, areaFilter: string): PayslipNotifyPeriodBody {
  const body: PayslipNotifyPeriodBody = { payroll_period_id: payrollPeriodId };
  if (areaFilter !== "all") {
    const id = Number.parseInt(areaFilter, 10);
    if (!Number.isNaN(id)) body.department_id = id;
  }
  return body;
}

export async function notifyPayslipsForPeriod(payrollPeriodId: number, areaFilter: string) {
  return apiRequest<components["schemas"]["PayslipNotifyPeriodEnvelope"]>("/payslips/notify-period", {
    method: "POST",
    body: buildPayslipNotifyPeriodBody(payrollPeriodId, areaFilter),
  });
}

export function buildPayrollSummaryExportQuery(payrollPeriodId: number, areaFilter: string): string {
  const q = new URLSearchParams();
  q.set("payroll_period_id", String(payrollPeriodId));
  if (areaFilter !== "all") {
    const id = Number.parseInt(areaFilter, 10);
    if (!Number.isNaN(id)) q.set("department_id", String(id));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function downloadPayrollSummaryXlsx(payrollPeriodId: number, areaFilter: string): Promise<void> {
  await downloadReportXlsx(`reports/exports/payroll.xlsx${buildPayrollSummaryExportQuery(payrollPeriodId, areaFilter)}`);
}

export async function downloadPayrollSummaryPdf(payrollPeriodId: number, areaFilter: string): Promise<void> {
  await downloadReportPdf(`reports/exports/payroll.pdf${buildPayrollSummaryExportQuery(payrollPeriodId, areaFilter)}`);
}

export async function downloadPayrollPayslipsZip(payrollPeriodId: number, areaFilter: string): Promise<void> {
  await downloadReportZip(`reports/exports/payroll-payslips.zip${buildPayrollSummaryExportQuery(payrollPeriodId, areaFilter)}`);
}

export async function downloadPayslipPdf(id: number): Promise<void> {
  await downloadReportPdf(`payslips/${id}/pdf`);
}
