import { Bell, LogOut, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";
import { useAuth, ROLE_LABELS } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationsContext";

interface Props {
  onToggleSidebar: () => void;
}

export function TopBar({ onToggleSidebar }: Props) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsWrapRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const initials = user?.nombre?.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "?";

  useEffect(() => {
    if (!showNotifications) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (notificationsWrapRef.current?.contains(target)) return;
      const el = target instanceof Element ? target : null;
      if (
        el?.closest("[data-radix-menu-content]") ||
        el?.closest("[data-radix-dropdown-menu-content]")
      ) {
        return;
      }
      setShowNotifications(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showNotifications]);

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">
          Plataforma de Recursos Humanos
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <RoleSwitcher />

        {/* Notifications */}
        <div ref={notificationsWrapRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
          {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 hover:bg-muted rounded-lg px-3 py-1.5 transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium leading-tight">{user?.nombre}</p>
                <p className="text-xs text-muted-foreground">{user ? ROLE_LABELS[user.rol] : ""}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={async () => {
                await logout();
                navigate("/login", { replace: true });
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
