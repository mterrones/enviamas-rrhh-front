import { apiRequest } from "@/api/client";

export type AuditLogRow = {
  id: number;
  created_at: string | null;
  user: { id: number; name: string; email: string } | null;
  action: string;
  resource_type: string;
  resource_id: number | null;
  meta: Record<string, unknown> | null;
  ip_address: string | null;
};

export type AuditLogPaginatedEnvelope = {
  data: AuditLogRow[];
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

export type AuditLogListParams = {
  page?: number;
  per_page?: number;
};

function buildAuditLogsQuery(params: AuditLogListParams): string {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.per_page != null) q.set("per_page", String(params.per_page));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchAuditLogsPage(params: AuditLogListParams = {}) {
  return apiRequest<AuditLogPaginatedEnvelope>(`/audit-logs${buildAuditLogsQuery(params)}`);
}
