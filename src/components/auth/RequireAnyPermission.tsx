import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type RequireAnyPermissionProps = {
  permissions: string[];
  children: ReactNode;
};

export function RequireAnyPermission({ permissions, children }: RequireAnyPermissionProps) {
  const { hasAnyPermission, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground text-sm">Cargando sesión…</div>
    );
  }

  if (!hasAnyPermission(permissions)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
