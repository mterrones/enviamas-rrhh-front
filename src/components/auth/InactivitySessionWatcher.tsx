import { useAuth } from "@/contexts/AuthContext";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";

export function InactivitySessionWatcher() {
  const { user, initializing, logout } = useAuth();
  const enabled = !initializing && user !== null;
  useInactivityLogout(logout, enabled);
  return null;
}
