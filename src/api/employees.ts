import type { components } from "@/api/contracts";
import { AGGREGATION_PAGE_SIZE } from "@/constants/pagination";
import { apiRequest, ApiHttpError } from "@/api/client";

export type Employee = components["schemas"]["Employee"];
export type EmployeeWrite = components["schemas"]["EmployeeWrite"];

export type EmployeeListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  department_id?: number;
};

function buildEmployeesQuery(params: EmployeeListParams): string {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.per_page != null) q.set("per_page", String(params.per_page));
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.status && params.status !== "todos") q.set("status", params.status);
  if (params.department_id != null) q.set("department_id", String(params.department_id));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchEmployeesPage(params: EmployeeListParams = {}) {
  return apiRequest<components["schemas"]["EmployeePaginatedEnvelope"]>(
    `/employees${buildEmployeesQuery(params)}`,
  );
}

export async function fetchAllEmployees(
  params: Omit<EmployeeListParams, "page" | "per_page"> = {},
): Promise<Employee[]> {
  const per_page = AGGREGATION_PAGE_SIZE;
  const first = await fetchEmployeesPage({ ...params, page: 1, per_page });
  const out = [...first.data];
  const lastPage = first.meta.last_page ?? 1;
  for (let p = 2; p <= lastPage; p++) {
    const r = await fetchEmployeesPage({ ...params, page: p, per_page });
    out.push(...r.data);
  }
  return out;
}

export type VacationBalanceData = {
  year: number;
  annual_days: number;
  days_used: number;
  days_pending: number;
  days_available: number;
};

export type VacationBalanceEnvelope = {
  data: VacationBalanceData;
};

export async function fetchEmployeeVacationBalance(employeeId: number, year?: number) {
  const q = year != null ? `?year=${year}` : "";
  return apiRequest<VacationBalanceEnvelope>(`/employees/${employeeId}/vacation-balance${q}`);
}

export async function fetchEmployee(id: number) {
  return apiRequest<components["schemas"]["EmployeeEnvelope"]>(`/employees/${id}`);
}

export type EmployeeTermination = components["schemas"]["EmployeeTermination"];

export async function fetchEmployeeTermination(
  employeeId: number,
): Promise<components["schemas"]["EmployeeTerminationEnvelope"] | null> {
  try {
    return await apiRequest<components["schemas"]["EmployeeTerminationEnvelope"]>(
      `/employees/${employeeId}/termination`,
    );
  } catch (e) {
    if (e instanceof ApiHttpError && e.status === 404) {
      return null;
    }
    throw e;
  }
}

export async function createEmployee(body: EmployeeWrite) {
  return apiRequest<components["schemas"]["EmployeeEnvelope"]>("/employees", {
    method: "POST",
    body,
  });
}

export async function updateEmployee(id: number, body: Partial<EmployeeWrite>) {
  return apiRequest<components["schemas"]["EmployeeEnvelope"]>(`/employees/${id}`, {
    method: "PATCH",
    body,
  });
}
