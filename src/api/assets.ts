import type { components } from "@/api/contracts";
import { AGGREGATION_PAGE_SIZE } from "@/constants/pagination";
import { apiRequest, buildApiUrl, ApiHttpError } from "@/api/client";
import { getAuthToken } from "@/api/authToken";

export type Asset = components["schemas"]["Asset"];
export type AssetWrite = components["schemas"]["AssetWrite"];

export type AssetListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  employee_id?: number;
};

function buildAssetsQuery(params: AssetListParams): string {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.per_page != null) q.set("per_page", String(params.per_page));
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.status) q.set("status", params.status);
  if (params.employee_id != null) q.set("employee_id", String(params.employee_id));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchAssetsPage(params: AssetListParams = {}) {
  return apiRequest<components["schemas"]["AssetPaginatedEnvelope"]>(`/assets${buildAssetsQuery(params)}`);
}

export async function fetchAllAssetsForEmployee(employeeId: number): Promise<Asset[]> {
  const per_page = AGGREGATION_PAGE_SIZE;
  const first = await fetchAssetsPage({ employee_id: employeeId, page: 1, per_page });
  const out = [...first.data];
  const lastPage = first.meta.last_page ?? 1;
  for (let p = 2; p <= lastPage; p++) {
    const r = await fetchAssetsPage({ employee_id: employeeId, page: p, per_page });
    out.push(...r.data);
  }
  return out;
}

function appendAssetWriteToFormData(fd: FormData, body: AssetWrite): void {
  fd.append("type", body.type);
  fd.append("status", body.status);
  if (body.brand != null && body.brand !== "") fd.append("brand", body.brand);
  if (body.model != null && body.model !== "") fd.append("model", body.model);
  if (body.serial_number != null && body.serial_number !== "") fd.append("serial_number", body.serial_number);
  if (body.description != null && body.description !== "") fd.append("description", body.description);
  if (body.employee_id != null) fd.append("employee_id", String(body.employee_id));
  if (body.observations != null && body.observations !== "") fd.append("observations", body.observations);
  if (body.assigned_at != null && body.assigned_at !== "") fd.append("assigned_at", body.assigned_at);
}

export async function createAsset(body: AssetWrite, loanActPdf?: File | null) {
  if (loanActPdf) {
    const fd = new FormData();
    appendAssetWriteToFormData(fd, body);
    fd.append("loan_act", loanActPdf);
    return apiRequest<components["schemas"]["AssetEnvelope"]>("/assets", {
      method: "POST",
      body: fd,
    });
  }
  return apiRequest<components["schemas"]["AssetEnvelope"]>("/assets", {
    method: "POST",
    body,
  });
}

export async function downloadAssetLoanActBlob(assetId: number): Promise<Blob> {
  const headers = new Headers();
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(buildApiUrl(`/assets/${assetId}/loan-act`), { headers });
  if (!res.ok) {
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = { message: text || res.statusText };
    }
    throw new ApiHttpError(res.status, parsed);
  }
  return res.blob();
}

export async function updateAsset(id: number, body: Partial<AssetWrite>) {
  return apiRequest<components["schemas"]["AssetEnvelope"]>(`/assets/${id}`, {
    method: "PATCH",
    body,
  });
}

export async function uploadAssetLoanActPdf(id: number, file: File) {
  const fd = new FormData();
  fd.append("loan_act", file);
  return apiRequest<components["schemas"]["AssetEnvelope"]>(`/assets/${id}/loan-act`, {
    method: "POST",
    body: fd,
  });
}

export async function deleteAsset(id: number): Promise<void> {
  await apiRequest<void>(`/assets/${id}`, { method: "DELETE" });
}
