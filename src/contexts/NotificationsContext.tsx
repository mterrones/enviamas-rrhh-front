import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onToastAdded } from "@/hooks/use-toast";

export interface Notification {
  id: number;
  type: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  link: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  addNotification: (title: string, description?: string, type?: string, link?: string) => void;
  markAsRead: (id: number) => void;
  deleteNotification: (id: number) => void;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  unreadCount: number;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

const initialNotifications: Notification[] = [
  { id: 1, type: "warning", title: "Contrato por vencer", description: "El contrato de Juan Pérez vence en 5 días", time: "Hace 2h", read: false, link: "/empleados" },
  { id: 2, type: "info", title: "Boleta disponible", description: "Boleta de marzo 2026 lista para descarga", time: "Hace 4h", read: false, link: "/boletas" },
  { id: 3, type: "success", title: "Solicitud aprobada", description: "Vacaciones de María López aprobadas", time: "Ayer", read: false, link: "/portal" },
  { id: 4, type: "info", title: "Nuevo empleado", description: "Carlos Mendoza registrado en el sistema", time: "Hace 2 días", read: true, link: "/empleados" },
];

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const addNotification = useCallback((title: string, description?: string, type: string = "info", link?: string) => {
    const newNotif: Notification = {
      id: Date.now(),
      title,
      description: description || "",
      type,
      time: "Justo ahora",
      read: false,
      link: link || getModuleRoute(window.location.pathname),
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAsRead = useCallback((id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const deleteNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const unsubscribe = onToastAdded((toastData) => {
      if (toastData.variant === "destructive") return;
      const title = typeof toastData.title === "string" ? toastData.title : "";
      const description = typeof toastData.description === "string" ? toastData.description : "";
      if (title) {
        addNotification(title, description, "info");
      }
    });
    return unsubscribe;
  }, [addNotification]);

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, markAsRead, deleteNotification, setNotifications, unreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
