import { apiRequest } from "@/api/client";
import type { AuditLogRow } from "@/api/auditLogs";

export type DashboardBirthdayEmployee = {
  id: number;
  first_name: string;
  last_name: string;
};

export type DashboardBirthdayMarkedDay = {
  day: number;
  employees: DashboardBirthdayEmployee[];
};

export type DashboardBirthdayCalendar = {
  year: number;
  month: number;
  marked_days: DashboardBirthdayMarkedDay[];
};

export type DashboardUpcomingBirthday = {
  employee_id: number;
  first_name: string;
  last_name: string;
  next_birthday_date: string;
  turning_age: number;
};

export type DashboardSummaryData = {
  active_employee_count: number;
  employees_by_department: {
    department_id: number | null;
    department_name: string;
    count: number;
  }[];
  pending_vacation_requests_count: number;
  contracts_expiring_window_days: number;
  contracts_expiring_count: number;
  contracts_expiring: {
    employee_id: number;
    first_name: string;
    last_name: string;
    department_name: string;
    contract_end: string | null;
    contract_type: string | null;
    days_remaining: number;
  }[];
  birthday_calendar: DashboardBirthdayCalendar;
  upcoming_birthdays: DashboardUpcomingBirthday[];
};

export type DashboardSummaryEnvelope = {
  data: DashboardSummaryData;
};

export type DashboardSummaryQuery = {
  days?: number;
  limit?: number;
};

export type MonthlyHireExitPoint = {
  month: string;
  hires: number;
  exits: number;
};

export type MonthlyHireExitFlowData = {
  months: number;
  series: MonthlyHireExitPoint[];
  definitions: {
    hires: string;
    exits: string;
  };
};

export type MonthlyHireExitFlowEnvelope = {
  data: MonthlyHireExitFlowData;
};

export type MonthlyHireExitFlowQuery = {
  months?: number;
};

function buildDashboardSummaryQuery(query: DashboardSummaryQuery): string {
  const q = new URLSearchParams();
  if (query.days != null) q.set("days", String(query.days));
  if (query.limit != null) q.set("limit", String(query.limit));
  const s = q.toString();
  return s ? `?${s}` : "";
}

function buildMonthlyHireExitFlowQuery(query: MonthlyHireExitFlowQuery): string {
  const q = new URLSearchParams();
  if (query.months != null) q.set("months", String(query.months));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchDashboardSummary(query: DashboardSummaryQuery = {}) {
  return apiRequest<DashboardSummaryEnvelope>(`/reports/dashboard-summary${buildDashboardSummaryQuery(query)}`);
}

export async function fetchMonthlyHireExitFlow(query: MonthlyHireExitFlowQuery = {}) {
  return apiRequest<MonthlyHireExitFlowEnvelope>(
    `/reports/monthly-hire-exit-flow${buildMonthlyHireExitFlowQuery(query)}`,
  );
}

export type PayrollPeriodAggregateRow = {
  payroll_period_id: number;
  year: number;
  month: number;
  gross_total: string;
  deductions_total: string;
  net_total: string;
};

export type PayrollPeriodAggregatesData = {
  limit: number;
  primary_metric: "net_total";
  periods: PayrollPeriodAggregateRow[];
  definitions: {
    summary: string;
    primary: string;
  };
};

export type PayrollPeriodAggregatesEnvelope = {
  data: PayrollPeriodAggregatesData;
};

export type PayrollPeriodAggregatesQuery = {
  limit?: number;
};

function buildPayrollPeriodAggregatesQuery(query: PayrollPeriodAggregatesQuery): string {
  const q = new URLSearchParams();
  if (query.limit != null) q.set("limit", String(query.limit));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchPayrollPeriodAggregates(query: PayrollPeriodAggregatesQuery = {}) {
  return apiRequest<PayrollPeriodAggregatesEnvelope>(
    `/reports/payroll-period-aggregates${buildPayrollPeriodAggregatesQuery(query)}`,
  );
}

export type DashboardRecentAuditEnvelope = {
  data: AuditLogRow[];
};

export async function fetchDashboardRecentAudit(limit = 12) {
  const q = new URLSearchParams();
  if (limit > 0) q.set("limit", String(Math.min(30, limit)));
  const s = q.toString();
  return apiRequest<DashboardRecentAuditEnvelope>(`/dashboard/recent-audit${s ? `?${s}` : ""}`);
}
