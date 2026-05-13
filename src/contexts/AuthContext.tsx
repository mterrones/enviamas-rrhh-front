import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { components } from "@/api/contracts";
import { apiRequest } from "@/api/client";
import { postImpersonate, postLeaveImpersonation } from "@/api/authImpersonation";
import { formatEmployeeName } from "@/lib/employeeName";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/api/authToken";

export type AppRole = "superadmin_rrhh" | "admin_rrhh" | "jefe_area" | "empleado";

export type ImpersonationBanner = {
  active: true;
  actor_id: number;
  actor_name: string;
  actor_email: string;
};

export interface User {
  id: string;
  nombre: string;
  email: string;
  avatar?: string;
  rol: AppRole;
  permissions?: string[];
  area?: string;
  employee?: {
    id: number;
    fullName: string;
  };
  impersonation?: ImpersonationBanner | null;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  superadmin_rrhh: "Superadmin RRHH",
  admin_rrhh: "Admin RRHH",
  jefe_area: "Jefe de Área",
  empleado: "Empleado",
};

const APP_ROLES: AppRole[] = ["superadmin_rrhh", "admin_rrhh", "jefe_area", "empleado"];

function toAppUser(me: components["schemas"]["UserMe"]): User {
  const rol: AppRole =
    me.role && APP_ROLES.includes(me.role as AppRole) ? (me.role as AppRole) : "empleado";

  const imp = me.impersonation;
  const impersonation: ImpersonationBanner | undefined =
    imp?.active === true && typeof imp.actor_id === "number"
      ? {
          active: true,
          actor_id: imp.actor_id,
          actor_name: imp.actor_name,
          actor_email: imp.actor_email,
        }
      : undefined;

  return {
    id: String(me.id),
    nombre: me.name,
    email: me.email,
    avatar: me.avatar_path ?? undefined,
    rol,
    permissions: Array.isArray(me.permissions) ? me.permissions : undefined,
    area: me.department?.name,
    employee: me.employee
      ? { id: me.employee.id, fullName: formatEmployeeName(me.employee) }
      : undefined,
    impersonation,
  };
}

const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  superadmin_rrhh: [
    "dashboard.view",
    "portal.view",
    "employees.view", "employees.create", "employees.edit", "employees.delete", "employees.offboard",
    "attendance.view", "attendance.manage", "attendance.approve",
    "payroll.view", "payroll.generate", "payroll.send",
    "portal.view",
    "assets.view", "assets.manage",
    "reports.view", "reports.export",
    "settings.view", "settings.users", "settings.smtp", "settings.params", "settings.audit", "settings.backup", "settings.profiles",
  ],
  admin_rrhh: [
    "dashboard.view",
    "employees.view", "employees.create", "employees.edit",
    "attendance.view", "attendance.manage", "attendance.approve",
    "payroll.view", "payroll.generate", "payroll.send",
    "portal.view",
    "assets.view", "assets.manage",
    "reports.view", "reports.export",
  ],
  jefe_area: [
    "dashboard.view",
    "employees.view",
    "employees.self_edit",
    "attendance.view", "attendance.approve",
    "payroll.view",
    "portal.view",
    "assets.view",
    "reports.view",
  ],
  empleado: [
    "portal.view",
    "employees.self_edit",
  ],
};

interface AuthContextType {
  user: User | null;
  initializing: boolean;
  loginWithToken: (token: string) => Promise<void>;
  startImpersonation: (userId: number) => Promise<void>;
  leaveImpersonation: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setInitializing(false);
      return;
    }

    (async () => {
      try {
        const res = await apiRequest<components["schemas"]["UserMeEnvelope"]>("/auth/me");
        setUser(toAppUser(res.data));
      } catch {
        clearAuthToken();
        setUser(null);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const loginWithToken = useCallback(async (token: string) => {
    setAuthToken(token);
    const res = await apiRequest<components["schemas"]["UserMeEnvelope"]>("/auth/me");
    setUser(toAppUser(res.data));
  }, []);

  const startImpersonation = useCallback(async (userId: number) => {
    const res = await postImpersonate(userId);
    await loginWithToken(res.data.token);
  }, [loginWithToken]);

  const leaveImpersonation = useCallback(async () => {
    const res = await postLeaveImpersonation();
    await loginWithToken(res.data.token);
  }, [loginWithToken]);

  const logout = useCallback(async () => {
    try {
      await apiRequest<void>("/auth/logout", { method: "POST" });
    } catch {
      clearAuthToken();
      setUser(null);
      return;
    }
    clearAuthToken();
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      const fromApi = user.permissions;
      const impersonating = user.impersonation?.active === true;
      if (impersonating) {
        return Array.isArray(fromApi) && fromApi.includes(permission);
      }
      const roleDefaults = ROLE_PERMISSIONS[user.rol] ?? [];
      if (fromApi !== undefined) {
        return fromApi.includes(permission) || roleDefaults.includes(permission);
      }
      return roleDefaults.includes(permission);
    },
    [user],
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) => permissions.some((p) => hasPermission(p)),
    [hasPermission],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        loginWithToken,
        startImpersonation,
        leaveImpersonation,
        logout,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
