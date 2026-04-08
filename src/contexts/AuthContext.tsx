import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { components } from "@/api/contracts";
import { apiRequest, ApiHttpError } from "@/api/client";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/api/authToken";

export type AppRole = "superadmin_rrhh" | "admin_rrhh" | "jefe_area" | "empleado";

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

  return {
    id: String(me.id),
    nombre: me.name,
    email: me.email,
    avatar: me.avatar_path ?? undefined,
    rol,
    permissions: Array.isArray(me.permissions) ? me.permissions : undefined,
    area: me.department?.name,
    employee: me.employee
      ? { id: me.employee.id, fullName: me.employee.full_name }
      : undefined,
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
    "attendance.view", "attendance.manage",
    "payroll.view", "payroll.generate", "payroll.send",
    "portal.view",
    "assets.view", "assets.manage",
    "reports.view", "reports.export",
  ],
  jefe_area: [
    "dashboard.view",
    "employees.view",
    "attendance.view", "attendance.approve",
    "payroll.view",
    "portal.view",
    "assets.view",
    "reports.view",
  ],
  empleado: [
    "portal.view",
  ],
};

interface AuthContextType {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
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

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest<components["schemas"]["LoginEnvelope"]>("/auth/login", {
      method: "POST",
      body: { email, password },
      skipAuth: true,
    });
    setAuthToken(res.data.token);
    setUser(toAppUser(res.data.user));
  }, []);

  const loginWithToken = useCallback(async (token: string) => {
    setAuthToken(token);
    const res = await apiRequest<components["schemas"]["UserMeEnvelope"]>("/auth/me");
    setUser(toAppUser(res.data));
  }, []);

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
      if (user.permissions !== undefined) {
        return user.permissions.includes(permission);
      }
      return ROLE_PERMISSIONS[user.rol]?.includes(permission) ?? false;
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
        login,
        loginWithToken,
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
