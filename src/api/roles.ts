import type { components } from "@/api/contracts";
import { apiRequest } from "@/api/client";

export type RoleListItem = components["schemas"]["RoleListItem"];

export async function fetchRolesList() {
  return apiRequest<components["schemas"]["RoleListEnvelope"]>("/roles");
}
