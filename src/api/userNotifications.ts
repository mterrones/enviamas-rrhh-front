import { apiRequest } from "@/api/client";

export type UserNotificationRow = {
  id: number;
  kind: string;
  title: string;
  body: string | null;
  meta?: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string | null;
};

export type UserNotificationsEnvelope = {
  data: UserNotificationRow[];
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

export async function fetchUserNotificationsPage(params: { page?: number; per_page?: number } = {}) {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.per_page != null) q.set("per_page", String(params.per_page));
  const s = q.toString();

  return apiRequest<UserNotificationsEnvelope>(`/user-notifications${s ? `?${s}` : ""}`);
}

export async function patchUserNotificationRead(id: number) {
  return apiRequest<{ data: UserNotificationRow }>(`/user-notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function postUserNotificationsReadAll() {
  return apiRequest<{ data: { marked_count: number } }>("/user-notifications/read-all", {
    method: "POST",
  });
}
