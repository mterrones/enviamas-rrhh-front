import type { components } from "@/api/contracts";
import { apiRequest } from "@/api/client";

export type LegalParameterListItem = components["schemas"]["LegalParameterListItem"];

export type LegalParametersListEnvelope = components["schemas"]["LegalParametersListEnvelope"];

export type LegalParameterUpdateBody = components["schemas"]["LegalParameterUpdateBody"];

export async function fetchLegalParameters(at?: string) {
  const q = at != null && at !== "" ? `?at=${encodeURIComponent(at)}` : "";
  return apiRequest<LegalParametersListEnvelope>(`/legal-parameters${q}`);
}

export async function patchLegalParameter(key: string, body: LegalParameterUpdateBody) {
  const path = `/legal-parameters/${encodeURIComponent(key)}`;
  return apiRequest<components["schemas"]["LegalParameterEnvelope"]>(path, {
    method: "PATCH",
    body,
  });
}
