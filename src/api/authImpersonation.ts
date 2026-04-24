import type { components } from "@/api/contracts";
import { apiRequest } from "@/api/client";

type LoginLikeEnvelope = {
  data: {
    token: string;
    token_type: string;
    user: components["schemas"]["UserMe"];
  };
};

export async function postImpersonate(userId: number) {
  return apiRequest<LoginLikeEnvelope>("/auth/impersonate", {
    method: "POST",
    body: { user_id: userId },
  });
}

export async function postLeaveImpersonation() {
  return apiRequest<LoginLikeEnvelope>("/auth/leave-impersonation", {
    method: "POST",
  });
}
