export const INACTIVE_LOGOUT_SESSION_KEY = "enviamas_rrhh_inactive_logout";

const DEFAULT_MS = 30 * 60 * 1000;
const MIN_MS = 60 * 1000;
const MAX_MS = 24 * 60 * 60 * 1000;

export function getInactivityLogoutMs(): number {
  const raw = import.meta.env.VITE_INACTIVITY_LOGOUT_MS;
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n)) {
    return DEFAULT_MS;
  }
  return Math.min(Math.max(n, MIN_MS), MAX_MS);
}
