import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardPage from "@/pages/DashboardPage";

export function HomeEntry() {
  const { hasPermission, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground text-sm">Cargando sesión…</div>
    );
  }

  if (hasPermission("dashboard.view")) {
    return <DashboardPage />;
  }

  if (hasPermission("portal.view")) {
    return <Navigate to="/portal" replace />;
  }

  return <Navigate to="/login" replace />;
}
