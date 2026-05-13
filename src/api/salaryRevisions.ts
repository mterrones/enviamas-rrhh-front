import { apiRequest } from "./client";

export type SalaryRevision = {
  id: number;
  employee_id: number;
  previous_amount: string | null;
  new_amount: string;
  effective_from: string;
  created_at: string | null;
  created_by: { id: number; name: string; email: string } | null;
};

export type SalaryEffectiveEnvelope = {
  data: { amount: string | null; year: number; month: number };
};

export async function fetchSalaryRevisions(employeeId: number) {
  return apiRequest<{ data: SalaryRevision[] }>(`/employees/${employeeId}/salary-revisions`);
}

export async function fetchEmployeeSalaryEffective(employeeId: number, year: number, month: number) {
  const q = new URLSearchParams({ year: String(year), month: String(month) });
  return apiRequest<SalaryEffectiveEnvelope>(`/employees/${employeeId}/salary-effective?${q.toString()}`);
}

export type SalaryRevisionCreateBody = {
  new_amount: number;
  effective_year: number;
  effective_month: number;
};

export async function createSalaryRevision(employeeId: number, body: SalaryRevisionCreateBody) {
  return apiRequest<{ data: SalaryRevision }>(`/employees/${employeeId}/salary-revisions`, {
    method: "POST",
    body,
  });
}
