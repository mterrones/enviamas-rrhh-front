import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, CalendarCheck, FileText, UserCircle,
  Monitor, BarChart3, Settings, ChevronLeft, ChevronRight, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/", permission: "dashboard.view" },
  { label: "Empleados", icon: Users, path: "/empleados", permission: "employees.view" },
  { label: "Asistencia", icon: CalendarCheck, path: "/asistencia", permission: "attendance.view" },
  { label: "Boletas y Nómina", icon: FileText, path: "/boletas", permission: "payroll.view" },
  { label: "Portal del Empleado", icon: UserCircle, path: "/portal", permission: "portal.view" },
  { label: "Activos y Equipos", icon: Monitor, path: "/activos", permission: "assets.view" },
  { label: "Reportes", icon: BarChart3, path: "/reportes", permission: "reports.view" },
  { label: "Perfiles y Permisos", icon: ShieldCheck, path: "/perfiles", permission: "settings.profiles" },
  { label: "Configuración", icon: Settings, path: "/configuracion", permission: "settings.view" },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: Props) {
  const location = useLocation();
  const { hasPermission } = useAuth();

  const visibleItems = navItems.filter(item => hasPermission(item.permission));

  return (
    <aside
      className={cn(
        "gradient-sidebar flex flex-col transition-all duration-300 ease-in-out relative shrink-0",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">EM</span>
          </div>
          {!collapsed && (
            <div className="whitespace-nowrap">
              <p className="text-sidebar-accent-foreground font-semibold text-sm leading-tight">EnviaMas</p>
              <p className="text-sidebar-foreground text-xs">RRHH</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-foreground" /> : <ChevronLeft className="w-3.5 h-3.5 text-foreground" />}
      </button>
    </aside>
  );
}
