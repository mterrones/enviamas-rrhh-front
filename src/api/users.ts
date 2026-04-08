import type { components } from "@/api/contracts";
import { apiRequest } from "@/api/client";

export type UserAdmin = components["schemas"]["UserAdmin"];

export type UserListParams = {
  page?: number;
  per_page?: number;
};

function buildQuery(params: UserListParams): string {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.per_page != null) q.set("per_page", String(params.per_page));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchUsersPage(params: UserListParams = {}) {
  return apiRequest<components["schemas"]["UserAdminPaginatedEnvelope"]>(
    `/users${buildQuery(params)}`,
  );
}

export type UserAdminCreate = components["schemas"]["UserAdminCreate"];

export async function createUser(body: UserAdminCreate) {
  return apiRequest<components["schemas"]["UserAdminEnvelope"]>("/users", {
    method: "POST",
    body,
  });
}

export type UserAdminUpdate = components["schemas"]["UserAdminUpdate"];

export async function updateUser(userId: number, body: UserAdminUpdate) {
  return apiRequest<components["schemas"]["UserAdminEnvelope"]>(`/users/${userId}`, {
    method: "PATCH",
    body,
  });
}

export async function setUserActive(userId: number, is_active: boolean) {
  return apiRequest<components["schemas"]["UserAdminEnvelope"]>(`/users/${userId}/active`, {
    method: "PATCH",
    body: { is_active },
  });
}
