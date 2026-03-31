import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, AlertTriangle, CheckCircle, X } from "lucide-react";

interface Notification {
  id: number;
  type: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  link: string;
}

const initialNotifications: Notification[] = [
  { id: 1, type: "warning", title: "Contrato por vencer", description: "El contrato de Juan Pérez vence en 5 días", time: "Hace 2h", read: false, link: "/empleados" },
  { id: 2, type: "info", title: "Boleta disponible", description: "Boleta de marzo 2026 lista para descarga", time: "Hace 4h", read: false, link: "/boletas" },
  { id: 3, type: "success", title: "Solicitud aprobada", description: "Vacaciones de María López aprobadas", time: "Ayer", read: false, link: "/portal" },
  { id: 4, type: "info", title: "Nuevo empleado", description: "Carlos Mendoza registrado en el sistema", time: "Hace 2 días", read: true, link: "/empleados" },
];

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
  onUnreadCountChange: (count: number) => void;
}

export function NotificationsPanel({ onClose, onUnreadCountChange }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const navigate = useNavigate();

  useEffect(() => {
    onUnreadCountChange(notifications.filter(n => !n.read).length);
  }, [notifications, onUnreadCountChange]);

  const handleClick = (n: Notification) => {
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
    navigate(n.link);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="absolute right-0 top-12 w-80 bg-card rounded-xl border border-border shadow-lg z-50 animate-fade-in">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-sm">Notificaciones</h3>
        <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sin notificaciones</p>
        ) : (
          notifications.map((n) => {
            const Icon = iconMap[n.type as keyof typeof iconMap];
            const color = colorMap[n.type as keyof typeof colorMap];
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex gap-3 p-4 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? 'bg-muted' : 'bg-card'}`}
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${color}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${n.read ? 'text-muted-foreground' : ''}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  className="shrink-0 mt-0.5 text-muted-foreground hover:text-destructive transition-colors"
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
