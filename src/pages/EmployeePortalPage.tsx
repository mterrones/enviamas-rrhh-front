import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  fetchAllPortalAttendanceInRange,
  fetchPortalContact,
  fetchPortalPayslipsPage,
  fetchPortalVacationRequestsPage,
  fetchPortalVacationBalance,
  fetchPortalNotificationsPage,
  patchPortalNotificationRead,
  postPortalNotificationsReadAll,
  patchPortalContact,
  type PortalPayslip,
  type PortalEmployeeNotification,
  type VacationBalanceData,
} from "@/api/portal";
import { DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import { FileText, Calendar as CalendarIcon, Bell, User, NotebookPen } from "lucide-react";
import { format, differenceInCalendarDays, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatDecimalHoursAsDuration } from "@/lib/formatWorkedDuration";

function formatPen(amount: string): string {
  const n = Number(amount);
  if (Number.isNaN(n)) return amount;
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n);
}

function payslipPeriodLabel(row: PortalPayslip): string {
  if (row.payroll_period) {
    const d = new Date(row.payroll_period.year, row.payroll_period.month - 1, 1);
    return format(d, "MMMM yyyy", { locale: es });
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
  return s.charAt(0).toUpperCase() + s.slice(1);
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

function requestErrorMessage(e: unknown): string {
  if (e instanceof ApiHttpError) {
    const m = e.apiError?.message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return "Ocurrió un error al cargar los datos.";
}

function formatNotificationDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
}

export default function EmployeePortalPage() {
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

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [showNuevaSolicitud, setShowNuevaSolicitud] = useState(false);
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>();
  const [fechaFin, setFechaFin] = useState<Date | undefined>();
  const [savingVacation, setSavingVacation] = useState(false);

  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactAddress, setContactAddress] = useState("");
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

  const balanceYear = useMemo(() => new Date().getFullYear(), []);

  const attendancePeriod = useMemo(() => {
    const now = new Date();
    return {
      from: format(startOfMonth(now), "yyyy-MM-dd"),
      to: format(endOfMonth(now), "yyyy-MM-dd"),
      title: format(now, "MMMM yyyy", { locale: es }),
    };
  }, [activeTab]);

  const diasCalculados =
    fechaInicio && fechaFin ? Math.max(differenceInCalendarDays(fechaFin, fechaInicio) + 1, 0) : 0;

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
    if (activeTab === "asistencia") void loadAttendance();
  }, [activeTab, loadAttendance]);

  const resetVacationForm = () => {
    setFechaInicio(undefined);
    setFechaFin(undefined);
  };

  const loadContact = useCallback(async () => {
    if (!hasEmployee) {
      setContactPhone("");
      setContactEmail("");
      setContactAddress("");
      setContactError(null);
      return;
    }
    setContactLoading(true);
    setContactError(null);
    try {
      const r = await fetchPortalContact();
      setContactPhone(r.data.phone ?? "");
      setContactEmail(r.data.personal_email ?? "");
      setContactAddress(r.data.address ?? "");
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
    const emailTrim = contactEmail.trim();
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
      });
      setContactPhone(r.data.phone ?? "");
      setContactEmail(r.data.personal_email ?? "");
      setContactAddress(r.data.address ?? "");
      toast({ title: "Datos actualizados", description: "Tu información de contacto se guardó correctamente." });
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
      await createPortalVacationRequest({
        start_date: format(fechaInicio, "yyyy-MM-dd"),
        end_date: format(fechaFin, "yyyy-MM-dd"),
        days: diasCalculados,
      });
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de vacaciones fue registrada correctamente.",
      });
      setShowNuevaSolicitud(false);
      resetVacationForm();
      await loadVacations();
      await loadVacationBalance();
    } catch (e) {
      const msg = requestErrorMessage(e);
      toast({ title: "No se pudo enviar", description: msg, variant: "destructive" });
    } finally {
      setSavingVacation(false);
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
            asistencia, solicitudes y datos de contacto.
          </p>
        )
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
          <TabsTrigger value="datos" className="gap-1.5">
            <NotebookPen className="w-4 h-4" />
            Datos de contacto
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
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map(b => (
                      <tr key={b.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3 text-sm font-medium">{payslipPeriodLabel(b)}</td>
                        <td className="px-5 py-3 text-sm">{formatPen(b.net_amount)}</td>
                        <td className="px-5 py-3">
                          <Badge variant="secondary" className="text-xs">
                            {payslipStatusLabel(b.status)}
                          </Badge>
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
                                <td className="px-2 py-2 tabular-nums">{r.record_date.slice(0, 10)}</td>
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
                onClick={() => setShowNuevaSolicitud(true)}
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
                    </tr>
                  </thead>
                  <tbody>
                    {vacations.map(v => (
                      <tr key={v.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3 text-sm font-medium">Vacaciones</td>
                        <td className="px-5 py-3 text-sm">
                          {v.start_date} — {v.end_date} ({v.days} días)
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={vacationStatusBadgeVariant(v.status)} className="text-xs">
                            {vacationStatusLabel(v.status)}
                          </Badge>
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
        </TabsContent>

        <TabsContent value="datos" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Datos de contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              {contactLoading ? (
                <p className="text-sm text-muted-foreground">Cargando…</p>
              ) : contactError ? (
                <div className="space-y-3">
                  <p className="text-sm text-destructive">{contactError}</p>
                  <Button size="sm" variant="outline" type="button" onClick={() => loadContact()}>
                    Reintentar
                  </Button>
                </div>
              ) : !hasEmployee ? (
                <p className="text-sm text-muted-foreground">{emptyStateNoEmployeeMessage}</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    El correo de acceso al sistema no se modifica aquí; solo tu correo personal de contacto en RRHH.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="portal-phone" className="text-sm">
                      Teléfono
                    </Label>
                    <Input
                      id="portal-phone"
                      type="tel"
                      autoComplete="tel"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="portal-email" className="text-sm">
                      Correo personal
                    </Label>
                    <Input
                      id="portal-email"
                      type="email"
                      autoComplete="email"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="portal-address" className="text-sm">
                      Dirección
                    </Label>
                    <Textarea
                      id="portal-address"
                      autoComplete="street-address"
                      value={contactAddress}
                      onChange={e => setContactAddress(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button size="sm" type="button" onClick={() => void handleSaveContact()} disabled={contactSaving}>
                    {contactSaving ? "Guardando…" : "Guardar cambios"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
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
            <DialogTitle>Nueva solicitud de vacaciones</DialogTitle>
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
                    {fechaInicio ? format(fechaInicio, "dd/MM/yyyy") : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaInicio}
                    onSelect={setFechaInicio}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    locale={es}
                  />
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
                    {fechaFin ? format(fechaFin, "dd/MM/yyyy") : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaFin}
                    onSelect={setFechaFin}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    locale={es}
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
              {savingVacation ? "Enviando…" : "Enviar solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
