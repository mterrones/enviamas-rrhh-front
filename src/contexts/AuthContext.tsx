import { createContext, useContext, useState, ReactNode } from "react";

export type AppRole = "superadmin_rrhh" | "admin_rrhh" | "jefe_area" | "empleado";

export interface User {
  id: string;
  nombre: string;
  email: string;
  avatar?: string;
  rol: AppRole;
  area?: string;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  superadmin_rrhh: "Superadmin RRHH",
  admin_rrhh: "Admin RRHH",
  jefe_area: "Jefe de Área",
  empleado: "Empleado",
};

// Permissions per module/action
const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  superadmin_rrhh: [
    "dashboard.view",
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
  user: User;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  switchRole: (role: AppRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS: Record<AppRole, User> = {
  superadmin_rrhh: { id: "1", nombre: "Ana Castillo", email: "ana@enviam.as", rol: "superadmin_rrhh" },
  admin_rrhh: { id: "2", nombre: "Lucía Fernández", email: "lucia@enviam.as", rol: "admin_rrhh" },
  jefe_area: { id: "3", nombre: "Carlos Mendoza", email: "carlos@enviam.as", rol: "jefe_area", area: "Contact Center" },
  empleado: { id: "4", nombre: "Juan Pérez", email: "juan@enviam.as", rol: "empleado", area: "Contact Center" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<AppRole>("superadmin_rrhh");
  const user = MOCK_USERS[currentRole];

  const hasPermission = (permission: string) =>
    ROLE_PERMISSIONS[user.rol]?.includes(permission) ?? false;

  const hasAnyPermission = (permissions: string[]) =>
    permissions.some((p) => hasPermission(p));

  const switchRole = (role: AppRole) => setCurrentRole(role);

  return (
    <AuthContext.Provider value={{ user, hasPermission, hasAnyPermission, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
