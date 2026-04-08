import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, AlertTriangle, CheckCircle, MoreVertical, X } from "lucide-react";
import type { Notification } from "@/contexts/NotificationsContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useToast } from "@/hooks/use-toast";
import { ApiHttpError } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const iconMap = {
  warning: AlertTriangle,
  info: FileText,
  success: CheckCircle,
};

const colorMap = {
  warning: "text-warning",
  info: "text-info",
  success: "text-success",
};

interface Props {
  onClose: () => void;
}

export function NotificationsPanel({ onClose }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    notifications,
    markNotificationRead,
    dismissNotification,
    markAllNotificationsRead,
    clearAllNotifications,
    unreadCount,
  } = useNotifications();
  const [markAllBusy, setMarkAllBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleClick = async (n: Notification) => {
    await markNotificationRead(n.id);
    navigate(n.link);
    onClose();
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await dismissNotification(id);
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markAllBusy) return;
    setMarkAllBusy(true);
    try {
      await markAllNotificationsRead();
    } catch (e) {
      const msg =
        e instanceof ApiHttpError ? e.apiError?.message ?? e.message : "No se pudo marcar todo como leído";
      toast({ title: "Error", description: typeof msg === "string" ? msg : "Intenta de nuevo", variant: "destructive" });
    } finally {
      setMarkAllBusy(false);
    }
  };

  const handleClearAll = () => {
    if (notifications.length === 0 || markAllBusy) return;
    clearAllNotifications();
  };

  return (
    <div className="absolute right-0 top-12 w-80 max-h-[min(28rem,75vh)] flex flex-col bg-card rounded-xl border border-border shadow-lg z-50 animate-fade-in">
      <div className="flex shrink-0 items-center justify-between gap-2 p-4 border-b border-border">
        <h3 className="font-semibold text-sm">Notificaciones</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label="Opciones de notificaciones"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              disabled={unreadCount === 0 || markAllBusy}
              title="Marca como leídas las notificaciones del portal (API) y las locales."
              onSelect={() => {
                void handleMarkAllRead();
              }}
            >
              {markAllBusy ? "Marcando…" : "Marcar todo como leído"}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={notifications.length === 0 || markAllBusy}
              title="Quita todas de esta vista. Las del portal se volverán a cargar al recargar la página; no hay borrado masivo en el servidor."
              onSelect={() => handleClearAll()}
            >
              Borrar todo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sin notificaciones</p>
        ) : (
          notifications.map((n) => {
            const Icon = iconMap[n.type as keyof typeof iconMap] ?? FileText;
            const color = colorMap[n.type as keyof typeof colorMap] ?? "text-info";
            return (
              <div
                key={`${n.source ?? "row"}-${n.id}`}
                onClick={() => void handleClick(n)}
                className={`flex gap-3 p-4 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? "bg-muted" : "bg-card"}`}
                role="button"
                tabIndex={0}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    void handleClick(n);
                  }
                }}
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${color}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${n.read ? "text-muted-foreground" : ""}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => void handleDelete(e, n.id)}
                  className="shrink-0 mt-0.5 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Descartar notificación"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
