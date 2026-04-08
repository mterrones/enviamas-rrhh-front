import type { components } from "@/api/contracts";
import { AGGREGATION_PAGE_SIZE } from "@/constants/pagination";
import { apiRequest } from "@/api/client";

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

export async function createAsset(body: AssetWrite) {
  return apiRequest<components["schemas"]["AssetEnvelope"]>("/assets", {
    method: "POST",
    body,
  });
}

export async function updateAsset(id: number, body: Partial<AssetWrite>) {
  return apiRequest<components["schemas"]["AssetEnvelope"]>(`/assets/${id}`, {
    method: "PATCH",
    body,
  });
}
