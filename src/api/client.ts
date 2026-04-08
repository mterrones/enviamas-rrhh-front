import { getAuthToken } from "./authToken";
import { parseApiErrorResponseText } from "./parseApiErrorResponse";
import type { ApiErrorBody } from "./types";

function resolvedBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!raw?.trim()) {
    return "http://localhost:8000/api/v1";
  }
  return raw.replace(/\/+$/, "");
}

export function buildApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${resolvedBaseUrl()}${normalized}`;
}

export type ApiClientInit = Omit<RequestInit, "body"> & {
  body?: unknown;
  skipAuth?: boolean;
};

export class ApiHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`HTTP ${status}`);
    this.name = "ApiHttpError";
  }

  get apiError(): ApiErrorBody | null {
    const b = this.body;
    if (b && typeof b === "object" && "message" in b && typeof (b as ApiErrorBody).message === "string") {
      return b as ApiErrorBody;
    }
    return null;
  }
}

export async function apiRequest<T>(path: string, init: ApiClientInit = {}): Promise<T> {
  const { body, skipAuth, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  headers.set("Accept", "application/json");

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(buildApiUrl(path), {
    ...rest,
    headers,
    body:
      body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiHttpError(response.status, parseApiErrorResponseText(text, response.status, response.statusText));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}
