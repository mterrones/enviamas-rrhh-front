import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ListPaginationBar } from "@/components/ListPaginationBar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ApiHttpError } from "@/api/client";
import type { VacationRequest } from "@/api/vacationRequests";
import type { AttendanceRecord } from "@/api/attendance";
import { filterWeekdayAttendanceRecords } from "@/lib/weekendAttendance";
import {
  createPortalVacationRequest,
  createPortalResignationRequest,
  deletePortalResignationRequest,
  deletePortalVacationRequest,
  patchPortalResignationRequest,
  patchPortalVacationRequest,
  downloadPortalAssetLoanActBlob,
  downloadPortalPayslipPdfBlob,
  downloadPortalResignationLetterBlob,
  fetchAllPortalAttendanceInRange,
  fetchPortalAssetsPage,
  fetchPortalContact,
  fetchPortalPayslipsPage,
  fetchPortalResignationRequestsPage,
  fetchPortalVacationRequestsPage,
  fetchPortalVacationBalance,
  fetchPortalNotificationsPage,
  patchPortalNotificationRead,
  postPortalNotificationsReadAll,
  patchPortalContact,
  type PortalPayslip,
  type PortalEmployeeNotification,
  type PortalAsset,
  type PortalResignationRequest,
  type VacationBalanceData,
} from "@/api/portal";
import { DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import { FileText, Calendar as CalendarIcon, Bell, User, NotebookPen, Laptop, Download, Pencil, Trash2 } from "lucide-react";
import { format, differenceInCalendarDays, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { formatDecimalHoursAsDuration } from "@/lib/formatWorkedDuration";
import { formatAppDate, formatAppDateTime, formatAppMonthYear } from "@/lib/formatAppDate";

function formatPen(amount: string): string {
  const n = Number(amount);
  if (Number.isNaN(n)) return amount;
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n);
}

function payslipPeriodLabel(row: PortalPayslip): string {
  if (row.payroll_period) {
    return formatAppMonthYear(row.payroll_period.month, row.payroll_period.year);
  }
  return `Periodo #${row.payroll_period_id}`;
}

function vacationStatusBadgeVariant(
  s: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (s === "aprobado") return "default";
  if (s === "rechazado") return "destructive";
  return "secondary";
}

function vacationStatusLabel(s: string): string {
  const m: Record<string, string> = {
    pendiente: "Pendiente",
    aprobado: "Aprobado",
    rechazado: "Rechazado",
  };
  return m[s] ?? s;
}

function payslipStatusLabel(s: string): string {
  if (!s) return "—";
  const m: Record<string, string> = { aprobada: "Aprobada", pendiente: "Pendiente" };
  return m[s] ?? s.charAt(0).toUpperCase() + s.slice(1);
}

function resignationStatusBadgeVariant(
  s: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (s === "aprobada") return "default";
  if (s === "rechazada") return "destructive";
  return "secondary";
}

function resignationStatusLabel(s: string): string {
  const m: Record<string, string> = {
    pendiente: "Pendiente",
    aprobada: "Aprobada",
    rechazada: "Rechazada",
  };
  return m[s] ?? s;
}

const PORTAL_ATT_STATUS: Record<string, string> = {
  asistido: "Asistido",
  recuperacion: "Recuperación",
  tardanza_j: "Tardanza justif.",
  tardanza_nj: "Tardanza",
  falta_j: "Falta justif.",
  falta_nj: "Falta",
  vacaciones: "Vacaciones",
};

function portalAttendanceStatusLabel(s: string): string {
  return PORTAL_ATT_STATUS[s] ?? s;
}

const portalAssetEstadoVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "En uso": "default",
  Asignado: "default",
  "En mantenimiento": "secondary",
  Devuelto: "outline",
  Disponible: "secondary",
};

function portalAssetDescription(a: PortalAsset): string {
  const d = a.description?.trim();
  if (d) return d;
  const parts = [a.brand, a.model].filter(Boolean);
  return parts.length ? parts.join(" ") : "—";
}

function formatPortalAssetAssignedDate(iso?: string | null): string {
  return formatAppDate(iso);
}

function requestErrorMessage(e: unknown): string {
  if (e instanceof ApiHttpError) {
    const m = e.apiError?.message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return "Ocurrió un error al cargar los datos.";
}

function formatNotificationDate(iso: string | null): string {
  return formatAppDateTime(iso);
}

const portalBankCatalog = ["BCP", "BBVA", "Interbank", "Scotiabank", "BanBif", "Caja Arequipa"];
const portalPensionCatalog = ["AFP Integra", "AFP Prima", "AFP Profuturo", "AFP Habitat", "ONP"];

const PORTAL_TAB_VALUES = new Set(["boletas", "asistencia", "solicitudes", "equipos", "datos", "notificaciones"]);

function portalCatalogExtra(value: string, known: string[]) {
  if (!value || known.includes(value)) return null;
  return (
    <SelectItem key={`__custom_${value}`} value={value}>
      {value}
    </SelectItem>
  );
}

export default function EmployeePortalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const hasEmployee = Boolean(user?.employee);
  const isAdminRrhhRole = user?.rol === "superadmin_rrhh" || user?.rol === "admin_rrhh";
  const emptyStateNoEmployeeMessage =
    isAdminRrhhRole && !hasEmployee
      ? "Sin datos: este portal muestra información de la ficha de empleado vinculada a tu usuario. Las cuentas administrativas no suelen tener ficha propia aquí."
      : "Sin datos hasta vincular tu ficha de empleado.";
  const welcomeName = user?.nombre ?? "…";

  const [activeTab, setActiveTab] = useState("boletas");

  const tabFromUrl = searchParams.get("tab");
  useEffect(() => {
    if (tabFromUrl && PORTAL_TAB_VALUES.has(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handlePortalTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (value === "boletas") {
            p.delete("tab");
          } else {
            p.set("tab", value);
          }
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const [payslipPage, setPayslipPage] = useState(1);
  const [payslips, setPayslips] = useState<PortalPayslip[]>([]);
  const [payslipMeta, setPayslipMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: DEFAULT_LIST_PAGE_SIZE,
  });
  const [payslipLoading, setPayslipLoading] = useState(false);
  const [payslipError, setPayslipError] = useState<string | null>(null);

  const [vacationPage, setVacationPage] = useState(1);
  const [vacations, setVacations] = useState<VacationRequest[]>([]);
  const [vacationMeta, setVacationMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: DEFAULT_LIST_PAGE_SIZE,
  });
  const [vacationLoading, setVacationLoading] = useState(false);
  const [vacationError, setVacationError] = useState<string | null>(null);

  const [resignationPage, setResignationPage] = useState(1);
  const [resignations, setResignations] = useState<PortalResignationRequest[]>([]);
  const [resignationMeta, setResignationMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: DEFAULT_LIST_PAGE_SIZE,
  });
  const [resignationLoading, setResignationLoading] = useState(false);
  const [resignationError, setResignationError] = useState<string | null>(null);
  const [proposedResignationDate, setProposedResignationDate] = useState("");
  const [resignationNotesText, setResignationNotesText] = useState("");
  const [submittingResignation, setSubmittingResignation] = useState(false);
  const resignationFileInputRef = useRef<HTMLInputElement>(null);
  const [resignationLetterDownloadingId, setResignationLetterDownloadingId] = useState<number | null>(null);

  const [vacationBalance, setVacationBalance] = useState<VacationBalanceData | null>(null);
  const [vacationBalanceLoading, setVacationBalanceLoading] = useState(false);
  const [vacationBalanceError, setVacationBalanceError] = useState<string | null>(null);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [showNuevaSolicitud, setShowNuevaSolicitud] = useState(false);
  const [editingVacationId, setEditingVacationId] = useState<number | null>(null);
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>();
  const [fechaFin, setFechaFin] = useState<Date | undefined>();
  const [savingVacation, setSavingVacation] = useState(false);
  const [vacationToDeleteId, setVacationToDeleteId] = useState<number | null>(null);
  const [vacationDeleteLoading, setVacationDeleteLoading] = useState(false);

  const [resignationEditRow, setResignationEditRow] = useState<PortalResignationRequest | null>(null);
  const resignationEditFileRef = useRef<HTMLInputElement>(null);
  const [resignationEditDate, setResignationEditDate] = useState("");
  const [resignationEditNotes, setResignationEditNotes] = useState("");
  const [resignationEditSaving, setResignationEditSaving] = useState(false);
  const [resignationToDeleteId, setResignationToDeleteId] = useState<number | null>(null);
  const [resignationDeleteLoading, setResignationDeleteLoading] = useState(false);

  const [corporateEmail, setCorporateEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactPersonalEmail, setContactPersonalEmail] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactEmergencyPhone, setContactEmergencyPhone] = useState("");
  const [bank, setBank] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [pensionFund, setPensionFund] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const [notificationPage, setNotificationPage] = useState(1);
  const [notifications, setNotifications] = useState<PortalEmployeeNotification[]>([]);
  const [notificationMeta, setNotificationMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: DEFAULT_LIST_PAGE_SIZE,
  });
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [notificationMarkingId, setNotificationMarkingId] = useState<number | null>(null);
  const [notificationMarkingAll, setNotificationMarkingAll] = useState(false);

  const [assetsPage, setAssetsPage] = useState(1);
  const [portalAssets, setPortalAssets] = useState<PortalAsset[]>([]);
  const [portalAssetsMeta, setPortalAssetsMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: DEFAULT_LIST_PAGE_SIZE,
  });
  const [portalAssetsLoading, setPortalAssetsLoading] = useState(false);
  const [portalAssetsError, setPortalAssetsError] = useState<string | null>(null);
  const [portalLoanActDownloadingId, setPortalLoanActDownloadingId] = useState<number | null>(null);
  const [payslipPdfDownloadingId, setPayslipPdfDownloadingId] = useState<number | null>(null);

  const balanceYear = useMemo(() => new Date().getFullYear(), []);

  const attendancePeriod = useMemo(() => {
    const now = new Date();
    return {
      from: format(startOfMonth(now), "yyyy-MM-dd"),
      to: format(endOfMonth(now), "yyyy-MM-dd"),
      title: formatAppMonthYear(now.getMonth() + 1, now.getFullYear()),
    };
  }, [activeTab]);

  const diasCalculados =
    fechaInicio && fechaFin ? Math.max(differenceInCalendarDays(fechaFin, fechaInicio) + 1, 0) : 0;

  const hasPendingResignation = useMemo(
    () => resignations.some(r => r.status === "pendiente"),
    [resignations],
  );

  const attendanceStats = useMemo(() => {
    let asistidos = 0;
    let faltas = 0;
    let tardanzas = 0;
    let otros = 0;
    for (const r of attendanceRecords) {
      switch (r.status) {
        case "asistido":
          asistidos++;
          break;
        case "falta_j":
        case "falta_nj":
          faltas++;
          break;
        case "tardanza_j":
        case "tardanza_nj":
          tardanzas++;
          break;
        default:
          otros++;
      }
    }
    return { asistidos, faltas, tardanzas, otros };
  }, [attendanceRecords]);

  const loadPayslips = useCallback(async () => {
    if (!hasEmployee) {
      setPayslips([]);
      setPayslipError(null);
      return;
    }
    setPayslipLoading(true);
    setPayslipError(null);
    try {
      const r = await fetchPortalPayslipsPage({ page: payslipPage, per_page: DEFAULT_LIST_PAGE_SIZE });
      setPayslips(r.data);
      setPayslipMeta({
        current_page: r.meta.current_page,
        last_page: r.meta.last_page,
        total: r.meta.total,
        per_page: r.meta.per_page,
      });
    } catch (e) {
      setPayslipError(requestErrorMessage(e));
      setPayslips([]);
    } finally {
      setPayslipLoading(false);
    }
  }, [hasEmployee, payslipPage]);

  const loadVacations = useCallback(async () => {
    if (!hasEmployee) {
      setVacations([]);
      setVacationError(null);
      return;
    }
    setVacationLoading(true);
    setVacationError(null);
    try {
      const r = await fetchPortalVacationRequestsPage({
        page: vacationPage,
        per_page: DEFAULT_LIST_PAGE_SIZE,
      });
      setVacations(r.data);
      setVacationMeta({
        current_page: r.meta.current_page,
        last_page: r.meta.last_page,
        total: r.meta.total,
        per_page: r.meta.per_page,
      });
    } catch (e) {
      setVacationError(requestErrorMessage(e));
      setVacations([]);
    } finally {
      setVacationLoading(false);
    }
  }, [hasEmployee, vacationPage]);

  const loadResignations = useCallback(async () => {
    if (!hasEmployee) {
      setResignations([]);
      setResignationError(null);
      return;
    }
    setResignationLoading(true);
    setResignationError(null);
    try {
      const r = await fetchPortalResignationRequestsPage({
        page: resignationPage,
        per_page: DEFAULT_LIST_PAGE_SIZE,
      });
      setResignations(r.data);
      setResignationMeta({
        current_page: r.meta.current_page,
        last_page: r.meta.last_page,
        total: r.meta.total,
        per_page: r.meta.per_page,
      });
    } catch (e) {
      setResignationError(requestErrorMessage(e));
      setResignations([]);
    } finally {
      setResignationLoading(false);
    }
  }, [hasEmployee, resignationPage]);

  const loadVacationBalance = useCallback(async () => {
    if (!hasEmployee) {
      setVacationBalance(null);
      setVacationBalanceError(null);
      return;
    }
    setVacationBalanceLoading(true);
    setVacationBalanceError(null);
    try {
      const r = await fetchPortalVacationBalance(balanceYear);
      setVacationBalance(r.data);
    } catch (e) {
      setVacationBalanceError(requestErrorMessage(e));
      setVacationBalance(null);
    } finally {
      setVacationBalanceLoading(false);
    }
  }, [hasEmployee, balanceYear]);

  const loadAttendance = useCallback(async () => {
    if (!hasEmployee) {
      setAttendanceRecords([]);
      setAttendanceError(null);
      return;
    }
    setAttendanceLoading(true);
    setAttendanceError(null);
    try {
      const rows = await fetchAllPortalAttendanceInRange({
        from: attendancePeriod.from,
        to: attendancePeriod.to,
      });
      setAttendanceRecords(filterWeekdayAttendanceRecords(rows));
    } catch (e) {
      setAttendanceError(requestErrorMessage(e));
      setAttendanceRecords([]);
    } finally {
      setAttendanceLoading(false);
    }
  }, [hasEmployee, attendancePeriod.from, attendancePeriod.to]);

  useEffect(() => {
    if (activeTab === "boletas") void loadPayslips();
  }, [activeTab, loadPayslips]);

  useEffect(() => {
    if (activeTab === "solicitudes") void loadVacations();
  }, [activeTab, loadVacations]);

  useEffect(() => {
    if (activeTab === "solicitudes") void loadVacationBalance();
  }, [activeTab, loadVacationBalance]);

  useEffect(() => {
    if (activeTab === "solicitudes") void loadResignations();
  }, [activeTab, loadResignations]);

  useEffect(() => {
    if (activeTab === "asistencia") void loadAttendance();
  }, [activeTab, loadAttendance]);

  const resetVacationForm = () => {
    setFechaInicio(undefined);
    setFechaFin(undefined);
    setEditingVacationId(null);
  };

  const loadContact = useCallback(async () => {
    if (!hasEmployee) {
      setCorporateEmail("");
      setContactPhone("");
      setContactPersonalEmail("");
      setContactAddress("");
      setContactEmergencyPhone("");
      setBank("");
      setBankAccount("");
      setPensionFund("");
      setContactError(null);
      return;
    }
    setContactLoading(true);
    setContactError(null);
    try {
      const r = await fetchPortalContact();
      setCorporateEmail(r.data.corporate_email ?? "");
      setContactPhone(r.data.phone ?? "");
      setContactPersonalEmail(r.data.personal_email ?? "");
      setContactAddress(r.data.address ?? "");
      setContactEmergencyPhone(r.data.emergency_contact_phone ?? "");
      setBank(r.data.bank ?? "");
      setBankAccount(r.data.bank_account ?? "");
      setPensionFund(r.data.pension_fund ?? "");
    } catch (e) {
      setContactError(requestErrorMessage(e));
    } finally {
      setContactLoading(false);
    }
  }, [hasEmployee]);

  useEffect(() => {
    if (activeTab === "datos") void loadContact();
  }, [activeTab, loadContact]);

  const loadNotifications = useCallback(async () => {
    if (!hasEmployee) {
      setNotifications([]);
      setNotificationError(null);
      return;
    }
    setNotificationLoading(true);
    setNotificationError(null);
    try {
      const r = await fetchPortalNotificationsPage({
        page: notificationPage,
        per_page: DEFAULT_LIST_PAGE_SIZE,
      });
      setNotifications(r.data);
      setNotificationMeta({
        current_page: r.meta.current_page,
        last_page: r.meta.last_page,
        total: r.meta.total,
        per_page: r.meta.per_page,
      });
    } catch (e) {
      setNotificationError(requestErrorMessage(e));
      setNotifications([]);
    } finally {
      setNotificationLoading(false);
    }
  }, [hasEmployee, notificationPage]);

  useEffect(() => {
    if (activeTab === "notificaciones") void loadNotifications();
  }, [activeTab, loadNotifications]);

  const loadPortalAssets = useCallback(async () => {
    if (!hasEmployee) {
      setPortalAssets([]);
      setPortalAssetsError(null);
      return;
    }
    setPortalAssetsLoading(true);
    setPortalAssetsError(null);
    try {
      const r = await fetchPortalAssetsPage({ page: assetsPage, per_page: DEFAULT_LIST_PAGE_SIZE });
      setPortalAssets(r.data);
      setPortalAssetsMeta({
        current_page: r.meta.current_page,
        last_page: r.meta.last_page,
        total: r.meta.total,
        per_page: r.meta.per_page,
      });
    } catch (e) {
      setPortalAssetsError(requestErrorMessage(e));
      setPortalAssets([]);
    } finally {
      setPortalAssetsLoading(false);
    }
  }, [hasEmployee, assetsPage]);

  useEffect(() => {
    if (activeTab === "equipos") void loadPortalAssets();
  }, [activeTab, loadPortalAssets]);

  const handleDownloadPayslipPdf = async (row: PortalPayslip) => {
    setPayslipPdfDownloadingId(row.id);
    try {
      const blob = await downloadPortalPayslipPdfBlob(row.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const periodSlug = payslipPeriodLabel(row)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9.-]/g, "");
      anchor.download = periodSlug ? `boleta-${periodSlug}.pdf` : `boleta-pago-${row.id}.pdf`;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof ApiHttpError ? err.apiError?.message ?? err.message : "No se pudo descargar el PDF";
      toast({ title: "Error", description: typeof msg === "string" ? msg : "Intenta de nuevo", variant: "destructive" });
    } finally {
      setPayslipPdfDownloadingId(null);
    }
  };

  const handleSubmitResignation = async () => {
    const file = resignationFileInputRef.current?.files?.[0];
    if (!file) {
      toast({ title: "Adjunta la carta", description: "Se requiere un archivo PDF.", variant: "destructive" });
      return;
    }
    setSubmittingResignation(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      if (proposedResignationDate.trim()) {
        fd.set("proposed_effective_date", proposedResignationDate.trim());
      }
      if (resignationNotesText.trim()) {
        fd.set("notes", resignationNotesText.trim());
      }
      await createPortalResignationRequest(fd);
      toast({
        title: "Solicitud enviada",
        description: "RRHH revisará tu carta. Recibirás una notificación cuando haya una respuesta.",
      });
      setProposedResignationDate("");
      setResignationNotesText("");
      if (resignationFileInputRef.current) {
        resignationFileInputRef.current.value = "";
      }
      await loadResignations();
    } catch (err) {
      const msg =
        err instanceof ApiHttpError ? err.apiError?.message ?? err.message : "No se pudo enviar la solicitud";
      toast({
        title: "Error",
        description: typeof msg === "string" ? msg : "Intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setSubmittingResignation(false);
    }
  };

  const handleDownloadPortalResignationLetter = async (row: PortalResignationRequest) => {
    setResignationLetterDownloadingId(row.id);
    try {
      const blob = await downloadPortalResignationLetterBlob(row.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const name = row.letter_original_name?.replace(/[^\w.-]+/g, "_") || `carta-renuncia-${row.id}.pdf`;
      anchor.download = name;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof ApiHttpError ? err.apiError?.message ?? err.message : "No se pudo descargar el PDF";
      toast({ title: "Error", description: typeof msg === "string" ? msg : "Intenta de nuevo", variant: "destructive" });
    } finally {
      setResignationLetterDownloadingId(null);
    }
  };

  const handleDownloadPortalLoanAct = async (asset: PortalAsset) => {
    setPortalLoanActDownloadingId(asset.id);
    try {
      const blob = await downloadPortalAssetLoanActBlob(asset.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `acta-prestamo-activo-${asset.id}.pdf`;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof ApiHttpError ? err.apiError?.message ?? err.message : "No se pudo descargar el PDF";
      toast({ title: "Error", description: typeof msg === "string" ? msg : "Intenta de nuevo", variant: "destructive" });
    } finally {
      setPortalLoanActDownloadingId(null);
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    setNotificationMarkingId(id);
    try {
      const r = await patchPortalNotificationRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? r.data : n)));
    } catch (e) {
      toast({
        title: "No se pudo marcar como leída",
        description: requestErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setNotificationMarkingId(null);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotificationMarkingAll(true);
    try {
      await postPortalNotificationsReadAll();
      const nowIso = new Date().toISOString();
      setNotifications(prev =>
        prev.map(n => (n.read_at == null ? { ...n, read_at: nowIso } : n)),
      );
    } catch (e) {
      toast({
        title: "No se pudo completar",
        description: requestErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setNotificationMarkingAll(false);
    }
  };

  const handleSaveContact = async () => {
    const emailTrim = contactPersonalEmail.trim();
    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      toast({
        title: "Correo no válido",
        description: "Revisa el formato del correo personal.",
        variant: "destructive",
      });
      return;
    }
    setContactSaving(true);
    try {
      const r = await patchPortalContact({
        phone: contactPhone.trim() || null,
        personal_email: emailTrim || null,
        address: contactAddress.trim() || null,
        emergency_contact_phone: contactEmergencyPhone.trim() || null,
        bank: bank.trim() || null,
        bank_account: bankAccount.trim() || null,
        pension_fund: pensionFund.trim() || null,
      });
      setCorporateEmail(r.data.corporate_email ?? "");
      setContactPhone(r.data.phone ?? "");
      setContactPersonalEmail(r.data.personal_email ?? "");
      setContactAddress(r.data.address ?? "");
      setContactEmergencyPhone(r.data.emergency_contact_phone ?? "");
      setBank(r.data.bank ?? "");
      setBankAccount(r.data.bank_account ?? "");
      setPensionFund(r.data.pension_fund ?? "");
      toast({ title: "Datos actualizados", description: "Tu información se guardó correctamente." });
    } catch (e) {
      const msg = requestErrorMessage(e);
      toast({ title: "No se pudo guardar", description: msg, variant: "destructive" });
    } finally {
      setContactSaving(false);
    }
  };

  const handleGuardarVacacion = async () => {
    if (!fechaInicio || !fechaFin || diasCalculados < 1) return;
    setSavingVacation(true);
    try {
      const start = format(fechaInicio, "yyyy-MM-dd");
      const end = format(fechaFin, "yyyy-MM-dd");
      if (editingVacationId != null) {
        await patchPortalVacationRequest(editingVacationId, { start_date: start, end_date: end });
        toast({
          title: "Solicitud actualizada",
          description: "Los cambios en tu solicitud de vacaciones se guardaron.",
        });
      } else {
        await createPortalVacationRequest({
          start_date: start,
          end_date: end,
          days: diasCalculados,
        });
        toast({
          title: "Solicitud enviada",
          description: "Tu solicitud de vacaciones fue registrada correctamente.",
        });
      }
      setShowNuevaSolicitud(false);
      resetVacationForm();
      await loadVacations();
      await loadVacationBalance();
    } catch (e) {
      const msg = requestErrorMessage(e);
      toast({
        title: editingVacationId != null ? "No se pudo guardar" : "No se pudo enviar",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSavingVacation(false);
    }
  };

  const openEditVacation = (v: VacationRequest) => {
    setEditingVacationId(v.id);
    const s = v.start_date.slice(0, 10);
    const e = v.end_date.slice(0, 10);
    setFechaInicio(parseISO(`${s}T12:00:00`));
    setFechaFin(parseISO(`${e}T12:00:00`));
    setShowNuevaSolicitud(true);
  };

  const handleConfirmDeleteVacation = async () => {
    if (vacationToDeleteId == null) return;
    setVacationDeleteLoading(true);
    try {
      await deletePortalVacationRequest(vacationToDeleteId);
      toast({ title: "Solicitud eliminada", description: "La solicitud de vacaciones fue anulada." });
      setVacationToDeleteId(null);
      await loadVacations();
      await loadVacationBalance();
    } catch (e) {
      toast({ title: "Error", description: requestErrorMessage(e), variant: "destructive" });
    } finally {
      setVacationDeleteLoading(false);
    }
  };

  const openResignationEdit = (r: PortalResignationRequest) => {
    setResignationEditRow(r);
    setResignationEditDate(r.proposed_effective_date?.slice(0, 10) ?? "");
    setResignationEditNotes(r.notes ?? "");
  };

  const handleSaveResignationEdit = async () => {
    if (!resignationEditRow) return;
    setResignationEditSaving(true);
    try {
      const fd = new FormData();
      fd.set("notes", resignationEditNotes);
      const d = resignationEditDate.trim();
      if (d) fd.set("proposed_effective_date", d);
      const file = resignationEditFileRef.current?.files?.[0];
      if (file) fd.set("file", file);
      await patchPortalResignationRequest(resignationEditRow.id, fd);
      toast({ title: "Solicitud actualizada", description: "Los cambios se guardaron correctamente." });
      setResignationEditRow(null);
      if (resignationEditFileRef.current) resignationEditFileRef.current.value = "";
      await loadResignations();
    } catch (e) {
      toast({ title: "Error", description: requestErrorMessage(e), variant: "destructive" });
    } finally {
      setResignationEditSaving(false);
    }
  };

  const handleConfirmDeleteResignation = async () => {
    if (resignationToDeleteId == null) return;
    setResignationDeleteLoading(true);
    try {
      await deletePortalResignationRequest(resignationToDeleteId);
      toast({ title: "Solicitud eliminada", description: "Tu solicitud de renuncia fue anulada." });
      setResignationToDeleteId(null);
      await loadResignations();
    } catch (e) {
      toast({ title: "Error", description: requestErrorMessage(e), variant: "destructive" });
    } finally {
      setResignationDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Portal del Empleado</h1>
        <p className="text-muted-foreground text-sm mt-1">Bienvenido, {welcomeName}</p>
      </div>

      {!hasEmployee ? (
        isAdminRrhhRole ? (
          <p className="text-sm text-muted-foreground border border-border bg-muted/40 rounded-md px-4 py-3">
            Este apartado es el <span className="font-medium text-foreground">portal del empleado</span>: solo muestra boletas,
            asistencia y demás datos cuando tu usuario tiene una{" "}
            <span className="font-medium text-foreground">ficha de empleado vinculada</span>. Las cuentas de administración RRHH
            no suelen usar esta vista; si además trabajas como empleado, RRHH puede vincular tu usuario a tu ficha en el sistema.
          </p>
        ) : (
          <p className="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-md px-4 py-3">
            Tu cuenta no está vinculada a una ficha de empleado. Solicita a RRHH que asocien tu usuario para ver boletas,
            asistencia, solicitudes, equipos en préstamo y datos personales.
          </p>
        )
      ) : null}

      <Tabs value={activeTab} onValueChange={handlePortalTabChange}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="boletas" className="gap-1.5">
            <FileText className="w-4 h-4" />
            Mis Boletas
          </TabsTrigger>
          <TabsTrigger value="asistencia" className="gap-1.5">
            <CalendarIcon className="w-4 h-4" />
            Mis Asistencias
          </TabsTrigger>
          <TabsTrigger value="solicitudes" className="gap-1.5">
            <User className="w-4 h-4" />
            Mis Solicitudes
          </TabsTrigger>
          <TabsTrigger value="equipos" className="gap-1.5">
            <Laptop className="w-4 h-4" />
            Mis equipos
          </TabsTrigger>
          <TabsTrigger value="datos" className="gap-1.5">
            <NotebookPen className="w-4 h-4" />
            Datos
          </TabsTrigger>
          <TabsTrigger value="notificaciones" className="gap-1.5">
            <Bell className="w-4 h-4" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="boletas" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Mis Boletas de Pago</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payslipLoading ? (
                <p className="text-sm text-muted-foreground px-5 py-8">Cargando…</p>
              ) : payslipError ? (
                <div className="px-5 py-8 space-y-3">
                  <p className="text-sm text-destructive">{payslipError}</p>
                  <Button size="sm" variant="outline" type="button" onClick={() => loadPayslips()}>
                    Reintentar
                  </Button>
                </div>
              ) : !hasEmployee ? (
                <p className="text-sm text-muted-foreground px-5 py-8">{emptyStateNoEmployeeMessage}</p>
              ) : payslips.length === 0 ? (
                <p className="text-sm text-muted-foreground px-5 py-8">No hay boletas registradas para tu ficha.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Periodo</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Neto</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Estado</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3 w-[1%]">PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map(b => (
                      <tr key={b.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3 text-sm font-medium">{payslipPeriodLabel(b)}</td>
                        <td className="px-5 py-3 text-sm">{formatPen(b.net_amount)}</td>
                        <td className="px-5 py-3">
                          <Badge
                            variant={b.status === "aprobada" ? "default" : "secondary"}
                            className={
                              b.status === "aprobada"
                                ? "text-xs bg-emerald-600 hover:bg-emerald-600 text-white border-transparent"
                                : "text-xs"
                            }
                          >
                            {payslipStatusLabel(b.status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary gap-1 h-8 px-2"
                            type="button"
                            disabled={b.status !== "aprobada" || payslipPdfDownloadingId === b.id}
                            title="Descargar boleta en PDF"
                            onClick={() => void handleDownloadPayslipPdf(b)}
                          >
                            <Download className="w-3.5 h-3.5" />
                            {payslipPdfDownloadingId === b.id ? "Descargando…" : "Descargar"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!payslipLoading && !payslipError && hasEmployee && payslipMeta.total > 0 ? (
                <ListPaginationBar
                  page={payslipMeta.current_page}
                  lastPage={payslipMeta.last_page}
                  total={payslipMeta.total}
                  pageSize={payslipMeta.per_page}
                  loading={payslipLoading}
                  onPageChange={setPayslipPage}
                />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asistencia" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Mi Asistencia — {attendancePeriod.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <p className="text-sm text-muted-foreground">Cargando…</p>
              ) : attendanceError ? (
                <div className="space-y-3">
                  <p className="text-sm text-destructive">{attendanceError}</p>
                  <Button size="sm" variant="outline" type="button" onClick={() => loadAttendance()}>
                    Reintentar
                  </Button>
                </div>
              ) : !hasEmployee ? (
                <p className="text-sm text-muted-foreground">{emptyStateNoEmployeeMessage}</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Resumen según registros del sistema para el mes en curso (no incluye horas extra ni conceptos no
                    modelados en asistencia).
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {(
                      [
                        ["Días asistidos", String(attendanceStats.asistidos)],
                        ["Faltas", String(attendanceStats.faltas)],
                        ["Tardanzas", String(attendanceStats.tardanzas)],
                        ["Otros registros", String(attendanceStats.otros)],
                      ] as const
                    ).map(([l, v]) => (
                      <div key={l} className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{v}</p>
                        <p className="text-xs text-muted-foreground mt-1">{l}</p>
                      </div>
                    ))}
                  </div>
                  {attendanceRecords.length > 0 ? (
                    <div className="mt-6 border-t border-border pt-4 overflow-x-auto">
                      <p className="text-sm font-medium mb-2">Registros del mes</p>
                      <table className="w-full text-xs min-w-[480px]">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="text-left font-semibold text-muted-foreground px-2 py-2">Fecha</th>
                            <th className="text-left font-semibold text-muted-foreground px-2 py-2">Estado</th>
                            <th className="text-left font-semibold text-muted-foreground px-2 py-2">Entrada</th>
                            <th className="text-left font-semibold text-muted-foreground px-2 py-2">Salida</th>
                            <th className="text-left font-semibold text-muted-foreground px-2 py-2">Horas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceRecords
                            .slice()
                            .sort((a, b) => a.record_date.localeCompare(b.record_date))
                            .map((r) => (
                              <tr key={r.id} className="border-b border-border last:border-0">
                                <td className="px-2 py-2 tabular-nums">{formatAppDate(r.record_date)}</td>
                                <td className="px-2 py-2">{portalAttendanceStatusLabel(r.status)}</td>
                                <td className="px-2 py-2 tabular-nums">{r.check_in ?? "—"}</td>
                                <td className="px-2 py-2 tabular-nums">{r.check_out ?? "—"}</td>
                                <td className="px-2 py-2 tabular-nums">
                                  {formatDecimalHoursAsDuration(r.hours_worked)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-4">No hay registros de asistencia en el mes.</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solicitudes" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Mis Solicitudes</CardTitle>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  resetVacationForm();
                  setShowNuevaSolicitud(true);
                }}
                disabled={!hasEmployee}
              >
                Nueva solicitud
              </Button>
            </CardHeader>
            {hasEmployee ? (
              <div className="px-5 py-3 border-b border-border bg-muted/20 text-sm space-y-1">
                {vacationBalanceLoading ? (
                  <p className="text-muted-foreground">Cargando saldo de vacaciones…</p>
                ) : vacationBalanceError ? (
                  <div className="space-y-2">
                    <p className="text-destructive text-xs">{vacationBalanceError}</p>
                    <Button size="sm" variant="outline" type="button" onClick={() => loadVacationBalance()}>
                      Reintentar
                    </Button>
                  </div>
                ) : vacationBalance ? (
                  <>
                    <p className="font-medium">Saldo de vacaciones ({vacationBalance.year})</p>
                    <p className="text-xs text-muted-foreground">
                      Tope anual: {vacationBalance.annual_days} · Usados (aprobados): {vacationBalance.days_used} ·
                      Pendientes: {vacationBalance.days_pending} · Disponibles: {vacationBalance.days_available}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cálculo por año calendario; sin arrastre de saldos entre años en esta versión.
                    </p>
                  </>
                ) : null}
              </div>
            ) : null}
            <CardContent className="p-0">
              {vacationLoading ? (
                <p className="text-sm text-muted-foreground px-5 py-8">Cargando…</p>
              ) : vacationError ? (
                <div className="px-5 py-8 space-y-3">
                  <p className="text-sm text-destructive">{vacationError}</p>
                  <Button size="sm" variant="outline" type="button" onClick={() => loadVacations()}>
                    Reintentar
                  </Button>
                </div>
              ) : !hasEmployee ? (
                <p className="text-sm text-muted-foreground px-5 py-8">{emptyStateNoEmployeeMessage}</p>
              ) : vacations.length === 0 ? (
                <p className="text-sm text-muted-foreground px-5 py-8">No hay solicitudes de vacaciones registradas.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Tipo</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Fechas</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Estado</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3 w-[1%]">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vacations.map(v => (
                      <tr key={v.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3 text-sm font-medium">Vacaciones</td>
                        <td className="px-5 py-3 text-sm">
                          {formatAppDate(v.start_date)} — {formatAppDate(v.end_date)} ({v.days} días)
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={vacationStatusBadgeVariant(v.status)} className="text-xs">
                            {vacationStatusLabel(v.status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          {v.status === "pendiente" ? (
                            <div className="inline-flex gap-1 justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Editar"
                                onClick={() => openEditVacation(v)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Eliminar"
                                onClick={() => setVacationToDeleteId(v.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!vacationLoading && !vacationError && hasEmployee && vacationMeta.total > 0 ? (
                <ListPaginationBar
                  page={vacationMeta.current_page}
                  lastPage={vacationMeta.last_page}
                  total={vacationMeta.total}
                  pageSize={vacationMeta.per_page}
                  loading={vacationLoading}
                  onPageChange={setVacationPage}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-card mt-4">
            <CardHeader>
              <CardTitle className="text-base">Renuncia / cese laboral</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Puedes adjuntar tu carta de renuncia en PDF. Recursos Humanos revisará la solicitud; la desvinculación
                formal (cese en planilla, liquidación, etc.) se gestiona aparte cuando RRHH lo confirme en el sistema.
              </p>
              {!hasEmployee ? (
                <p className="text-sm text-muted-foreground">{emptyStateNoEmployeeMessage}</p>
              ) : (
                <>
                  {hasPendingResignation ? (
                    <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 rounded-md px-3 py-2">
                      Tienes una solicitud de renuncia pendiente de revisión por RRHH. Puedes editarla o anularla desde
                      el historial si necesitas corregir algo; no puedes enviar otra nueva hasta que sea resuelta.
                    </p>
                  ) : (
                    <div className="space-y-3 max-w-lg">
                      <div className="space-y-1.5">
                        <Label htmlFor="resignation-pdf">Carta de renuncia (PDF, máx. 5 MB)</Label>
                        <Input
                          id="resignation-pdf"
                          ref={resignationFileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          className="cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="resignation-date">Fecha propuesta de último día laborable (opcional)</Label>
                        <Input
                          id="resignation-date"
                          type="date"
                          value={proposedResignationDate}
                          onChange={e => setProposedResignationDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="resignation-notes">Comentario para RRHH (opcional)</Label>
                        <Textarea
                          id="resignation-notes"
                          value={resignationNotesText}
                          onChange={e => setResignationNotesText(e.target.value)}
                          rows={3}
                          placeholder="Ej. motivo breve, periodo de preaviso…"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={submittingResignation}
                        onClick={() => void handleSubmitResignation()}
                      >
                        {submittingResignation ? "Enviando…" : "Enviar carta"}
                      </Button>
                    </div>
                  )}

                  {resignationLoading ? (
                    <p className="text-sm text-muted-foreground">Cargando historial de renuncias…</p>
                  ) : resignationError ? (
                    <div className="space-y-2">
                      <p className="text-sm text-destructive">{resignationError}</p>
                      <Button size="sm" variant="outline" type="button" onClick={() => void loadResignations()}>
                        Reintentar
                      </Button>
                    </div>
                  ) : resignations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aún no registras solicitudes de renuncia enviadas.</p>
                  ) : (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-2">
                              Fecha propuesta
                            </th>
                            <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-2">Estado</th>
                            <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-2">Detalle</th>
                            <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-2 w-[1%]">
                              Acciones
                            </th>
                            <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-2 w-[1%]">
                              Carta
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {resignations.map(r => (
                            <tr key={r.id} className="border-b border-border last:border-0">
                              <td className="px-3 py-2 tabular-nums">
                                {r.proposed_effective_date != null ? formatAppDate(r.proposed_effective_date) : "—"}
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant={resignationStatusBadgeVariant(r.status)}
                                  className={
                                    r.status === "aprobada"
                                      ? "text-xs bg-emerald-600 hover:bg-emerald-600 text-white border-transparent"
                                      : "text-xs"
                                  }
                                >
                                  {resignationStatusLabel(r.status)}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-xs text-muted-foreground max-w-[200px]">
                                {r.status === "rechazada" && r.rejection_reason ? (
                                  <span className="line-clamp-2">{r.rejection_reason}</span>
                                ) : r.notes ? (
                                  <span className="line-clamp-2">{r.notes}</span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap">
                                {r.status === "pendiente" ? (
                                  <div className="inline-flex gap-1 justify-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      title="Editar"
                                      onClick={() => openResignationEdit(r)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      title="Eliminar"
                                      onClick={() => setResignationToDeleteId(r.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-primary gap-1 h-8 px-2"
                                  disabled={resignationLetterDownloadingId === r.id}
                                  onClick={() => void handleDownloadPortalResignationLetter(r)}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  {resignationLetterDownloadingId === r.id ? "…" : "PDF"}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {!resignationLoading && !resignationError && hasEmployee && resignationMeta.total > 0 ? (
                    <ListPaginationBar
                      page={resignationMeta.current_page}
                      lastPage={resignationMeta.last_page}
                      total={resignationMeta.total}
                      pageSize={resignationMeta.per_page}
                      loading={resignationLoading}
                      onPageChange={setResignationPage}
                    />
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipos" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Equipos y activos en préstamo</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {portalAssetsLoading ? (
                <p className="text-sm text-muted-foreground px-5 py-8">Cargando…</p>
              ) : portalAssetsError ? (
                <div className="px-5 py-8 space-y-3">
                  <p className="text-sm text-destructive">{portalAssetsError}</p>
                  <Button size="sm" variant="outline" type="button" onClick={() => void loadPortalAssets()}>
                    Reintentar
                  </Button>
                </div>
              ) : !hasEmployee ? (
                <p className="text-sm text-muted-foreground px-5 py-8">{emptyStateNoEmployeeMessage}</p>
              ) : portalAssets.length === 0 ? (
                <p className="text-sm text-muted-foreground px-5 py-8">
                  No tienes equipos o activos asignados en préstamo en este momento.
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Tipo</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Descripción</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Asignación</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Estado</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3 w-[1%]">Acta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portalAssets.map(a => (
                      <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-3 text-sm font-medium">{a.type}</td>
                        <td className="px-5 py-3 text-sm">{portalAssetDescription(a)}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">
                          {formatPortalAssetAssignedDate(a.assigned_at)}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={portalAssetEstadoVariant[a.status] ?? "secondary"} className="text-xs">
                            {a.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary gap-1 h-8 px-2"
                            type="button"
                            disabled={!a.has_loan_act || portalLoanActDownloadingId === a.id}
                            title={
                              a.has_loan_act ? "Descargar acta de préstamo (PDF)" : "No hay acta de préstamo cargada"
                            }
                            onClick={() => void handleDownloadPortalLoanAct(a)}
                          >
                            <Download className="w-3.5 h-3.5" />
                            {portalLoanActDownloadingId === a.id ? "Descargando…" : "PDF"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!portalAssetsLoading && !portalAssetsError && hasEmployee && portalAssetsMeta.total > 0 ? (
                <ListPaginationBar
                  page={portalAssetsMeta.current_page}
                  lastPage={portalAssetsMeta.last_page}
                  total={portalAssetsMeta.total}
                  pageSize={portalAssetsMeta.per_page}
                  loading={portalAssetsLoading}
                  onPageChange={setAssetsPage}
                />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="datos" className="mt-4 space-y-6 max-w-3xl">
          {contactLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : contactError ? (
            <Card className="shadow-card">
              <CardContent className="pt-6 space-y-3">
                <p className="text-sm text-destructive">{contactError}</p>
                <Button size="sm" variant="outline" type="button" onClick={() => void loadContact()}>
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          ) : !hasEmployee ? (
            <p className="text-sm text-muted-foreground">{emptyStateNoEmployeeMessage}</p>
          ) : (
            <>
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-base">Datos de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    El correo electrónico corporativo es el de tu cuenta de acceso y no se puede cambiar aquí. Puedes
                    actualizar el resto de datos cuando lo necesites.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="portal-corporate-email">Correo Electrónico</Label>
                      <Input
                        id="portal-corporate-email"
                        type="email"
                        readOnly
                        value={corporateEmail}
                        placeholder="—"
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portal-phone">Teléfono</Label>
                      <Input
                        id="portal-phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="Ej: 987654321"
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                        maxLength={50}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portal-address">Dirección</Label>
                      <Input
                        id="portal-address"
                        autoComplete="street-address"
                        placeholder="Ej: Av. Principal 123, Lima"
                        value={contactAddress}
                        onChange={e => setContactAddress(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="portal-personal-email">Correo Personal</Label>
                      <Input
                        id="portal-personal-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Ej: correo.personal@gmail.com"
                        value={contactPersonalEmail}
                        onChange={e => setContactPersonalEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portal-emergency-phone">Teléfono de emergencia</Label>
                      <Input
                        id="portal-emergency-phone"
                        type="tel"
                        placeholder="Ej: 912345678"
                        value={contactEmergencyPhone}
                        onChange={e => setContactEmergencyPhone(e.target.value)}
                        maxLength={50}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-base">Datos Bancarios y Previsionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Banco</Label>
                      <Select value={bank} onValueChange={setBank}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar banco" />
                        </SelectTrigger>
                        <SelectContent>
                          {portalCatalogExtra(bank, portalBankCatalog)}
                          {portalBankCatalog.map(b => (
                            <SelectItem key={b} value={b}>
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portal-bank-account">Número de cuenta</Label>
                      <Input
                        id="portal-bank-account"
                        placeholder="Ej: 19112345678901"
                        value={bankAccount}
                        onChange={e => setBankAccount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sistema previsional</Label>
                      <Select value={pensionFund} onValueChange={setPensionFund}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {portalCatalogExtra(pensionFund, portalPensionCatalog)}
                          {portalPensionCatalog.map(p => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button type="button" onClick={() => void handleSaveContact()} disabled={contactSaving}>
                {contactSaving ? "Guardando…" : "Guardar cambios"}
              </Button>
            </>
          )}
        </TabsContent>

        <TabsContent value="notificaciones" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">Notificaciones</CardTitle>
              {!notificationLoading &&
              !notificationError &&
              hasEmployee &&
              notifications.some(n => n.read_at == null) ? (
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  disabled={notificationMarkingAll}
                  onClick={() => void handleMarkAllNotificationsRead()}
                >
                  {notificationMarkingAll ? "Marcando…" : "Marcar todas como leídas"}
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              {notificationLoading ? (
                <p className="text-sm text-muted-foreground px-5 py-8">Cargando…</p>
              ) : notificationError ? (
                <div className="px-5 py-8 space-y-3">
                  <p className="text-sm text-destructive">{notificationError}</p>
                  <Button size="sm" variant="outline" type="button" onClick={() => void loadNotifications()}>
                    Reintentar
                  </Button>
                </div>
              ) : !hasEmployee ? (
                <p className="text-sm text-muted-foreground px-5 py-8">{emptyStateNoEmployeeMessage}</p>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground px-5 py-8">No hay notificaciones para mostrar.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Fecha</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Título</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Mensaje</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3 w-[1%]">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map(n => {
                      const unread = n.read_at == null;
                      return (
                        <tr
                          key={n.id}
                          className={cn(
                            "border-b border-border last:border-0 align-top",
                            unread && "bg-muted/25",
                          )}
                        >
                          <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {formatNotificationDate(n.created_at)}
                          </td>
                          <td
                            className={cn(
                              "px-5 py-3 text-sm max-w-[220px] break-words",
                              unread ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
                            )}
                          >
                            {n.title}
                          </td>
                          <td
                            className={cn(
                              "px-5 py-3 text-sm",
                              unread ? "text-foreground/90" : "text-muted-foreground",
                            )}
                          >
                            {n.body?.trim() || "—"}
                          </td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            {unread ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                type="button"
                                className="text-xs h-8"
                                disabled={notificationMarkingId === n.id || notificationMarkingAll}
                                onClick={() => void handleMarkNotificationRead(n.id)}
                              >
                                {notificationMarkingId === n.id ? "…" : "Marcar leída"}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Leída</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {!notificationLoading && !notificationError && hasEmployee && notificationMeta.total > 0 ? (
                <ListPaginationBar
                  page={notificationMeta.current_page}
                  lastPage={notificationMeta.last_page}
                  total={notificationMeta.total}
                  pageSize={notificationMeta.per_page}
                  loading={notificationLoading}
                  onPageChange={setNotificationPage}
                />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={showNuevaSolicitud}
        onOpenChange={open => {
          setShowNuevaSolicitud(open);
          if (!open) resetVacationForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVacationId != null ? "Editar solicitud de vacaciones" : "Nueva solicitud de vacaciones"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Fecha de inicio</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fechaInicio && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaInicio ? formatAppDate(fechaInicio) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="z-[100] w-auto p-0"
                  align="start"
                  side="bottom"
                  sideOffset={6}
                  collisionPadding={16}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Calendar mode="single" selected={fechaInicio} onSelect={setFechaInicio} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Fecha de fin</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fechaFin && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaFin ? formatAppDate(fechaFin) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="z-[100] w-auto p-0"
                  align="start"
                  side="bottom"
                  sideOffset={6}
                  collisionPadding={16}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Calendar
                    mode="single"
                    selected={fechaFin}
                    onSelect={setFechaFin}
                    initialFocus
                    className="pointer-events-auto"
                    disabled={date => (fechaInicio ? date < fechaInicio : false)}
                  />
                </PopoverContent>
              </Popover>
              {diasCalculados > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Total: {diasCalculados} día{diasCalculados !== 1 ? "s" : ""}
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNuevaSolicitud(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleGuardarVacacion()}
              disabled={!fechaInicio || !fechaFin || diasCalculados < 1 || savingVacation}
            >
              {savingVacation
                ? editingVacationId != null
                  ? "Guardando…"
                  : "Enviando…"
                : editingVacationId != null
                  ? "Guardar cambios"
                  : "Enviar solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={resignationEditRow !== null}
        onOpenChange={open => {
          if (!open) {
            setResignationEditRow(null);
            if (resignationEditFileRef.current) resignationEditFileRef.current.value = "";
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar solicitud de renuncia</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="resignation-edit-date">Fecha propuesta de último día laborable (opcional)</Label>
              <Input
                id="resignation-edit-date"
                type="date"
                value={resignationEditDate}
                onChange={e => setResignationEditDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resignation-edit-notes">Comentario para RRHH (opcional)</Label>
              <Textarea
                id="resignation-edit-notes"
                value={resignationEditNotes}
                onChange={e => setResignationEditNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resignation-edit-pdf">Reemplazar carta (PDF, máx. 5 MB, opcional)</Label>
              <Input
                id="resignation-edit-pdf"
                ref={resignationEditFileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">Si no eliges archivo, se conserva el PDF ya enviado.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setResignationEditRow(null)}>
              Cancelar
            </Button>
            <Button type="button" disabled={resignationEditSaving} onClick={() => void handleSaveResignationEdit()}>
              {resignationEditSaving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={vacationToDeleteId !== null} onOpenChange={open => !open && setVacationToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular esta solicitud de vacaciones?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Solo las solicitudes pendientes pueden eliminarse desde aquí.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={vacationDeleteLoading}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={vacationDeleteLoading}
              onClick={() => void handleConfirmDeleteVacation()}
            >
              {vacationDeleteLoading ? "…" : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resignationToDeleteId !== null} onOpenChange={open => !open && setResignationToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular esta solicitud de renuncia?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la solicitud y el PDF adjunto. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resignationDeleteLoading}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={resignationDeleteLoading}
              onClick={() => void handleConfirmDeleteResignation()}
            >
              {resignationDeleteLoading ? "…" : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
