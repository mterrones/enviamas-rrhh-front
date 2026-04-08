import { ApiHttpError } from "@/api/client";

function flattenValidationErrors(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const errors = (body as { errors?: Record<string, string[] | string> }).errors;
  if (!errors || typeof errors !== "object") return null;
  const parts: string[] = [];
  for (const v of Object.values(errors)) {
    if (Array.isArray(v)) {
      parts.push(...v.filter((x) => typeof x === "string"));
    } else if (typeof v === "string") {
      parts.push(v);
    }
  }
  return parts.length > 0 ? parts.join(" ") : null;
}

export function formatHttpErrorMessage(error: unknown): string {
  if (error instanceof ApiHttpError) {
    const validation = flattenValidationErrors(error.body);
    if (validation) {
      return validation;
    }
    const msg = error.apiError?.message;
    if (typeof msg === "string" && msg.trim()) {
      if (/\(HTTP \d+\)/.test(msg)) {
        return msg;
      }
      return `${msg} (HTTP ${error.status})`;
    }
    return `Error HTTP ${error.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Error desconocido";
}
