import type { components } from "@/api/contracts";
import { apiRequest, buildApiUrl, ApiHttpError } from "@/api/client";
import { getAuthToken } from "@/api/authToken";

export type EmployeeDocument = components["schemas"]["EmployeeDocument"];
export type EmployeeDocumentType = components["schemas"]["EmployeeDocumentType"];

export async function fetchEmployeeDocuments(employeeId: number) {
  return apiRequest<components["schemas"]["EmployeeDocumentListEnvelope"]>(`/employees/${employeeId}/documents`);
}

export async function uploadEmployeeDocument(employeeId: number, type: EmployeeDocumentType, file: File) {
  const body = new FormData();
  body.append("type", type);
  body.append("file", file);
  return apiRequest<components["schemas"]["EmployeeDocumentEnvelope"]>(`/employees/${employeeId}/documents`, {
    method: "POST",
    body,
  });
}

export async function fetchEmployeeDocumentBlob(
  employeeId: number,
  documentId: number,
  options?: { attachment?: boolean },
): Promise<Blob> {
  const qs = options?.attachment ? "?attachment=1" : "";
  const headers = new Headers();
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(
    buildApiUrl(`/employees/${employeeId}/documents/${documentId}/file${qs}`),
    { headers },
  );
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

export async function deleteEmployeeDocument(employeeId: number, documentId: number) {
  return apiRequest<undefined>(`/employees/${employeeId}/documents/${documentId}`, {
    method: "DELETE",
  });
}
