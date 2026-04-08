import type { components } from "@/api/contracts";
import { apiRequest } from "@/api/client";

export type VacationRequest = components["schemas"]["VacationRequest"];
export type VacationWrite = components["schemas"]["VacationWrite"];
export type VacationStatus = components["schemas"]["VacationStatus"];
export type VacationStatusPatch = components["schemas"]["VacationStatusPatch"];

export type VacationListParams = {
  page?: number;
  per_page?: number;
  employee_id?: number;
  status?: VacationStatus;
};

function buildVacationQuery(params: VacationListParams): string {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.per_page != null) q.set("per_page", String(params.per_page));
  if (params.employee_id != null) q.set("employee_id", String(params.employee_id));
  if (params.status) q.set("status", params.status);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchVacationRequestsPage(params: VacationListParams = {}) {
  return apiRequest<components["schemas"]["VacationPaginatedEnvelope"]>(
    `/vacation-requests${buildVacationQuery(params)}`,
  );
}

export async function createVacationRequest(body: VacationWrite) {
  return apiRequest<components["schemas"]["VacationEnvelope"]>("/vacation-requests", {
    method: "POST",
    body,
  });
}

export async function patchVacationRequestStatus(id: number, body: VacationStatusPatch) {
  return apiRequest<components["schemas"]["VacationEnvelope"]>(`/vacation-requests/${id}/status`, {
    method: "PATCH",
    body,
  });
}
