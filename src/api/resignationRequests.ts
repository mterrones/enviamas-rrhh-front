import { apiRequest, buildApiUrl, ApiHttpError } from "@/api/client";
import { getAuthToken } from "@/api/authToken";

export type HrResignationEmployee = {
  id: number;
  first_name: string;
  last_name: string;
};

export type HrResignationRequest = {
  id: number;
  employee_id: number;
  status: string;
  proposed_effective_date: string | null;
  notes: string | null;
  letter_original_name: string | null;
  reviewed_at: string | null;
  reviewed_by_user_id: number | null;
  rejection_reason: string | null;
  created_at: string | null;
  updated_at: string | null;
  employee: HrResignationEmployee | null;
};

export type HrResignationEnvelope = {
  data: HrResignationRequest[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
};

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchHrResignationRequestsPage(params: {
  page?: number;
  per_page?: number;
  status?: string;
  employee_id?: number;
} = {}) {
  return apiRequest<HrResignationEnvelope>(
    `/resignation-requests${buildQuery({
      page: params.page,
      per_page: params.per_page,
      status: params.status,
      employee_id: params.employee_id,
    })}`,
  );
}

export type HrResignationStatus = "pendiente" | "aprobada" | "rechazada";

export async function patchResignationRequestStatus(
  id: number,
  body: { status: HrResignationStatus; rejection_reason?: string | null },
) {
  return apiRequest<{ data: HrResignationRequest }>(`/resignation-requests/${id}/status`, {
    method: "PATCH",
    body,
  });
}

export async function downloadHrResignationLetterBlob(resignationId: number): Promise<Blob> {
  const headers = new Headers();
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(buildApiUrl(`/resignation-requests/${resignationId}/letter`), { headers });
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
