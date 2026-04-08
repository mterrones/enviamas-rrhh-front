import type { components } from "@/api/contracts";
import { AGGREGATION_PAGE_SIZE } from "@/constants/pagination";
import { apiRequest, buildApiUrl, ApiHttpError } from "@/api/client";
import { getAuthToken } from "@/api/authToken";
import { parseApiErrorResponseText } from "@/api/parseApiErrorResponse";

export type AttendanceRecord = components["schemas"]["AttendanceRecord"];
export type AttendanceWrite = components["schemas"]["AttendanceWrite"];
export type AttendancePatch = components["schemas"]["AttendancePatch"];
export type AttendanceStatus = components["schemas"]["AttendanceStatus"];

export type AttendanceListParams = {
  page?: number;
  per_page?: number;
  employee_id?: number;
  from?: string;
  to?: string;
};

function buildAttendanceQuery(params: AttendanceListParams): string {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.per_page != null) q.set("per_page", String(params.per_page));
  if (params.employee_id != null) q.set("employee_id", String(params.employee_id));
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchAttendancePage(params: AttendanceListParams = {}) {
  return apiRequest<components["schemas"]["AttendancePaginatedEnvelope"]>(
    `/attendance${buildAttendanceQuery(params)}`,
  );
}

export async function fetchAllAttendanceInRange(
  params: Omit<AttendanceListParams, "page" | "per_page">,
): Promise<AttendanceRecord[]> {
  const per_page = AGGREGATION_PAGE_SIZE;
  const first = await fetchAttendancePage({ ...params, page: 1, per_page });
  const out = [...first.data];
  const lastPage = first.meta.last_page ?? 1;
  for (let p = 2; p <= lastPage; p++) {
    const r = await fetchAttendancePage({ ...params, page: p, per_page });
    out.push(...r.data);
  }
  return out;
}

export async function createAttendanceRecord(body: AttendanceWrite) {
  return apiRequest<components["schemas"]["AttendanceEnvelope"]>("/attendance", {
    method: "POST",
    body,
  });
}

export async function patchAttendanceRecord(id: number, body: AttendancePatch) {
  return apiRequest<components["schemas"]["AttendanceEnvelope"]>(`/attendance/${id}`, {
    method: "PATCH",
    body,
  });
}

export async function uploadAttendanceJustificationFile(attendanceId: number, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return apiRequest<components["schemas"]["AttendanceEnvelope"]>(`/attendance/${attendanceId}/justification`, {
    method: "POST",
    body: fd,
  });
}

export async function downloadAttendanceJustificationBlob(attendanceId: number): Promise<Blob> {
  const res = await fetch(buildApiUrl(`/attendance/${attendanceId}/justification-file`), {
    headers: {
      Authorization: `Bearer ${getAuthToken() ?? ""}`,
      Accept: "*/*",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiHttpError(res.status, parseApiErrorResponseText(text, res.status, res.statusText));
  }
  return res.blob();
}
