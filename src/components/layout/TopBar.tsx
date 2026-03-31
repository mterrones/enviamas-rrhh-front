import { Bell, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { NotificationsPanel, Notification } from "@/components/notifications/NotificationsPanel";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";
import { useAuth, ROLE_LABELS } from "@/contexts/AuthContext";

const initialNotifications: Notification[] = [
  { id: 1, type: "warning", title: "Contrato por vencer", description: "El contrato de Juan Pérez vence en 5 días", time: "Hace 2h", read: false, link: "/empleados" },
  { id: 2, type: "info", title: "Boleta disponible", description: "Boleta de marzo 2026 lista para descarga", time: "Hace 4h", read: false, link: "/boletas" },
  { id: 3, type: "success", title: "Solicitud aprobada", description: "Vacaciones de María López aprobadas", time: "Ayer", read: false, link: "/portal" },
  { id: 4, type: "info", title: "Nuevo empleado", description: "Carlos Mendoza registrado en el sistema", time: "Hace 2 días", read: true, link: "/empleados" },
];

interface Props {
  onToggleSidebar: () => void;
}

export function TopBar({ onToggleSidebar }: Props) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const { user } = useAuth();
  const initials = user.nombre.split(" ").map(n => n[0]).join("").slice(0, 2);
  const unreadCount = notifications.filter(n => !n.read).length;

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
        <div className="relative">
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
          {showNotifications && (
            <NotificationsPanel
              notifications={notifications}
              onNotificationsChange={setNotifications}
              onClose={() => setShowNotifications(false)}
            />
          )}
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
                <p className="text-sm font-medium leading-tight">{user.nombre}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.rol]}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-destructive cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
