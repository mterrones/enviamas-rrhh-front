const storageKey = "enviamas_rrhh_api_token";

export function getAuthToken(): string | null {
  try {
    return globalThis.localStorage?.getItem(storageKey) ?? null;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  globalThis.localStorage?.setItem(storageKey, token);
}

export function clearAuthToken(): void {
  globalThis.localStorage?.removeItem(storageKey);
}
