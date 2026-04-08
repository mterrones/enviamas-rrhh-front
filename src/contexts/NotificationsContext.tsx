import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { onToastAdded } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchPortalNotificationsPage,
  patchPortalNotificationRead,
  postPortalNotificationsReadAll,
  type PortalEmployeeNotification,
} from "@/api/portal";
import { ApiHttpError } from "@/api/client";

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const STORAGE_PREFIX = "enviarrhh.headerToastNotifications.v1";

/** Maps sub-routes to their parent module route */
function getModuleRoute(path: string): string {
  const segments = path.split("/").filter(Boolean);
  if (segments.length > 1) {
    return "/" + segments[0];
  }
  return path;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  link: string;
  source?: "portal" | "toast";
  /** ISO timestamp for retention (portal: from API; toast: stored locally) */
  createdAt?: string | null;
}

function isWithinRetention(createdAt: string | null | undefined): boolean {
  if (createdAt == null || createdAt === "") return true;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t <= RETENTION_MS;
}

function mapPortalKindToType(kind: string): "warning" | "info" | "success" {
  const k = kind.toLowerCase();
  if (k.includes("vacation") || k.includes("vacac") || k.includes("aprob") || k.includes("approved")) {
    return "success";
  }
  if (k.includes("contract") || k.includes("contrato") || k.includes("venc") || k.includes("expir")) {
    return "warning";
  }
  return "info";
}

function formatNotificationTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
}

function mapPortalRow(n: PortalEmployeeNotification): Notification {
  const createdAt = n.created_at ?? null;
  return {
    id: n.id,
    type: mapPortalKindToType(n.kind ?? ""),
    title: n.title,
    description: (n.body ?? "").trim() || "—",
    time: formatNotificationTime(createdAt),
    read: n.read_at != null,
    link: "/portal",
    source: "portal",
    createdAt,
  };
}

function storageKeyForUser(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function loadToastFromStorage(userId: string): Notification[] {
  try {
    const raw = localStorage.getItem(storageKeyForUser(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{
      id: number;
      type: string;
      title: string;
      description: string;
      read: boolean;
      link: string;
      createdAt: string;
    }>;
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - RETENTION_MS;
    const kept = parsed.filter((p) => {
      const t = new Date(p.createdAt).getTime();
      return !Number.isNaN(t) && t >= cutoff;
    });
    if (kept.length !== parsed.length) {
      localStorage.setItem(storageKeyForUser(userId), JSON.stringify(kept));
    }
    return kept.map((p) => ({
      id: p.id,
      type: p.type,
      title: p.title,
      description: p.description,
      read: p.read,
      link: p.link,
      time: formatNotificationTime(p.createdAt),
      source: "toast" as const,
      createdAt: p.createdAt,
    }));
  } catch {
    return [];
  }
}

function saveToastToStorage(userId: string, items: Notification[]) {
  try {
    const toastOnly = items.filter((n) => n.source === "toast");
    const payload = toastOnly.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      description: n.description,
      read: n.read,
      link: n.link,
      createdAt: n.createdAt ?? new Date().toISOString(),
    }));
    localStorage.setItem(storageKeyForUser(userId), JSON.stringify(payload));
  } catch {
    /* quota or private mode */
  }
}

interface NotificationsContextType {
  notifications: Notification[];
  addNotification: (title: string, description?: string, type?: string, link?: string) => void;
  markNotificationRead: (id: number) => Promise<void>;
  dismissNotification: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearAllNotifications: () => void;
  unreadCount: number;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { hasPermission, user } = useAuth();
  const canPortal = hasPermission("portal.view");

  const [toastNotifications, setToastNotifications] = useState<Notification[]>([]);
  const [portalNotifications, setPortalNotifications] = useState<Notification[]>([]);

  const userId = user?.id != null ? String(user.id) : null;

  useEffect(() => {
    if (!userId) {
      setToastNotifications([]);
      return;
    }
    setToastNotifications(loadToastFromStorage(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    saveToastToStorage(userId, toastNotifications);
  }, [userId, toastNotifications]);

  const notifications = useMemo(() => {
    return [...toastNotifications, ...portalNotifications].filter((n) => isWithinRetention(n.createdAt));
  }, [toastNotifications, portalNotifications]);

  const notificationsRef = useRef<Notification[]>([]);
  notificationsRef.current = notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!canPortal) {
      setPortalNotifications([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const r = await fetchPortalNotificationsPage({ page: 1, per_page: 20 });
        if (cancelled) return;
        const rows = r.data.map(mapPortalRow).filter((n) => isWithinRetention(n.createdAt));
        setPortalNotifications(rows);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiHttpError && e.status === 404) {
          setPortalNotifications([]);
        } else {
          setPortalNotifications([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canPortal, user?.id]);

  const addNotification = useCallback((title: string, description?: string, type: string = "info", link?: string) => {
    const createdAt = new Date().toISOString();
    const newNotif: Notification = {
      id: Date.now(),
      title,
      description: description || "",
      type,
      time: formatNotificationTime(createdAt),
      read: false,
      link: link || getModuleRoute(window.location.pathname),
      source: "toast",
      createdAt,
    };
    setToastNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markNotificationRead = useCallback(async (id: number) => {
    const n = notificationsRef.current.find((x) => x.id === id);
    if (!n || n.read) return;

    if (n.source === "portal") {
      try {
        const r = await patchPortalNotificationRead(id);
        const mapped = mapPortalRow(r.data);
        setPortalNotifications((prev) => prev.map((x) => (x.id === id ? mapped : x)));
      } catch {
        setPortalNotifications((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
      }
    } else {
      setToastNotifications((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
    }
  }, []);

  const dismissNotification = useCallback(async (id: number) => {
    const n = notificationsRef.current.find((x) => x.id === id);
    if (n?.source === "portal" && !n.read) {
      try {
        await patchPortalNotificationRead(id);
      } catch {
        /* ignore */
      }
    }
    if (n?.source === "toast") {
      setToastNotifications((prev) => prev.filter((x) => x.id !== id));
    } else {
      setPortalNotifications((prev) => prev.filter((x) => x.id !== id));
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    if (canPortal) {
      try {
        await postPortalNotificationsReadAll();
      } catch (e) {
        if (!(e instanceof ApiHttpError && e.status === 404)) {
          throw e;
        }
      }
      setPortalNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    }
    setToastNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
  }, [canPortal]);

  const clearAllNotifications = useCallback(() => {
    setToastNotifications([]);
    setPortalNotifications([]);
  }, []);

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
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        markNotificationRead,
        dismissNotification,
        markAllNotificationsRead,
        clearAllNotifications,
        unreadCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
