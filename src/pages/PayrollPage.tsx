import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Send, Plus, Pencil } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ApiHttpError } from "@/api/client";
import { fetchDepartments, type Department } from "@/api/departments";
import { fetchAllEmployees, type Employee } from "@/api/employees";
import {
  createPayrollPeriod,
  createPayslip,
  updatePayslip,
  notifyPayslipEmployee,
  notifyPayslipsForPeriod,
  downloadPayslipPdf,
  downloadPayrollSummaryPdf,
  downloadPayrollPayslipsZip,
  downloadPayrollSummaryXlsx,
  fetchPayrollPeriods,
  fetchAllPayslipsForPeriod,
  fetchPrevisionalPreview,
  type Payslip,
  type PayrollPeriod,
  type PrevisionalPreviewData,
} from "@/api/payroll";
import { ListPaginationBar } from "@/components/ListPaginationBar";
import { DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function periodLabel(p: PayrollPeriod): string {
  return `${meses[p.month - 1] ?? p.month} ${p.year}`;
}

function formatPen(amount: string | number): string {
  const n = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (Number.isNaN(n)) return `S/ ${amount}`;
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function regimeResolvedLabel(regime: string): string {
  switch (regime) {
    case "onp":
      return "ONP";
    case "afp_integra":
      return "AFP Integra";
    case "afp_prima":
      return "AFP Prima";
    case "unsupported":
      return "No soportado";
    default:
      return regime;
  }
}

function formatRatioPercent(ratio: string | null | undefined): string {
  if (ratio == null || ratio === "") return "—";
  const n = Number.parseFloat(ratio);
  if (Number.isNaN(n)) return ratio;
  return `${(n * 100).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`;
}

function payrollMutationErrorMessage(err: unknown): string {
  if (err instanceof ApiHttpError) {
    const code = err.apiError?.code;
    if (code === "DUPLICATE_PAYROLL_PERIOD") {
      return "Ya existe un periodo de nómina para ese año y mes.";
    }
    if (code === "DUPLICATE_PAYSLIP") {
      return "Ya existe una boleta para este empleado en el periodo seleccionado.";
    }
    if (code === "PREVISIONAL_ASSIST_NOT_APPLICABLE") {
      return (
        err.apiError?.message ??
        "No se puede aplicar la asistencia previsional con el régimen o parámetros legales actuales."
      );
    }
    return err.apiError?.message ?? err.message;
  }
  return "No se pudo completar la operación.";
}

const payrollYears = Array.from({ length: 11 }, (_, i) => 2020 + i);

export default function PayrollPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canGeneratePayroll = hasPermission("payroll.generate");
  const canExportPayrollSummary = hasPermission("reports.export") && hasPermission("payroll.view");
  const canSendPayslipNotification = hasPermission("payroll.send") && hasPermission("payroll.view");
  const payslipTableColSpan = canGeneratePayroll ? 6 : 5;
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [areaFilter, setAreaFilter] = useState("all");
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [payslipsLoading, setPayslipsLoading] = useState(false);
  const [payslipsError, setPayslipsError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [payslipReloadKey, setPayslipReloadKey] = useState(0);
  const [payslipTablePage, setPayslipTablePage] = useState(1);
  const PAYROLL_TABLE_SIZE = DEFAULT_LIST_PAGE_SIZE;
  const [previsionalLoading, setPrevisionalLoading] = useState(false);
  const [previsionalError, setPrevisionalError] = useState<string | null>(null);
  const [previsionalData, setPrevisionalData] = useState<PrevisionalPreviewData | null>(null);

  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [newPeriodYear, setNewPeriodYear] = useState(String(new Date().getFullYear()));
  const [newPeriodMonth, setNewPeriodMonth] = useState(String(new Date().getMonth() + 1));
  const [periodSaving, setPeriodSaving] = useState(false);

  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [payslipEmployeeId, setPayslipEmployeeId] = useState("");
  const [payslipGross, setPayslipGross] = useState("");
  const [payslipDeductions, setPayslipDeductions] = useState("");
  const [payslipNet, setPayslipNet] = useState("");
  const [payslipNetTouched, setPayslipNetTouched] = useState(false);
  const [payslipApplyPrevisional, setPayslipApplyPrevisional] = useState(false);
  const [payslipSaving, setPayslipSaving] = useState(false);

  const [payslipEditDialogOpen, setPayslipEditDialogOpen] = useState(false);
  const [editPayslipTarget, setEditPayslipTarget] = useState<Payslip | null>(null);
  const [editPayslipGross, setEditPayslipGross] = useState("");
  const [editPayslipDeductions, setEditPayslipDeductions] = useState("");
  const [editPayslipNet, setEditPayslipNet] = useState("");
  const [editPayslipNetTouched, setEditPayslipNetTouched] = useState(false);
  const [editPayslipSaving, setEditPayslipSaving] = useState(false);
  const [payrollExportBusy, setPayrollExportBusy] = useState<null | "xlsx" | "pdf">(null);
  const [payslipNotifyBusy, setPayslipNotifyBusy] = useState(false);
  const [payslipPdfBusy, setPayslipPdfBusy] = useState(false);
  const [payrollBulkNotifyBusy, setPayrollBulkNotifyBusy] = useState(false);
  const [payrollBulkZipBusy, setPayrollBulkZipBusy] = useState(false);

  const employeeById = useMemo(() => {
    const m: Record<number, Employee> = {};
    employeesList.forEach((e) => {
      m[e.id] = e;
    });
    return m;
  }, [employeesList]);

  const deptById = useMemo(() => {
    const m: Record<number, string> = {};
    departmentsList.forEach((d) => {
      m[d.id] = d.name;
    });
    return m;
  }, [departmentsList]);

  const selectedPeriod = useMemo(
    () => periods.find((p) => String(p.id) === selectedPeriodId),
    [periods, selectedPeriodId],
  );

  const filteredPayslips = useMemo(() => {
    if (areaFilter === "all") return payslips;
    const deptId = Number(areaFilter);
    if (Number.isNaN(deptId)) return payslips;
    return payslips.filter((p) => {
      const emp = employeeById[p.employee_id];
      return emp?.department_id === deptId;
    });
  }, [payslips, areaFilter, employeeById]);

  useEffect(() => {
    setPayslipTablePage(1);
  }, [selectedPeriodId, areaFilter, payslipReloadKey]);

  const payslipTableLastPage = Math.max(1, Math.ceil(filteredPayslips.length / PAYROLL_TABLE_SIZE));

  const payslipTableRows = useMemo(() => {
    const start = (payslipTablePage - 1) * PAYROLL_TABLE_SIZE;
    return filteredPayslips.slice(start, start + PAYROLL_TABLE_SIZE);
  }, [filteredPayslips, payslipTablePage]);

  useEffect(() => {
    if (payslipTablePage > payslipTableLastPage) {
      setPayslipTablePage(Math.max(1, payslipTableLastPage));
    }
  }, [payslipTablePage, payslipTableLastPage]);

  const previewSlip =
    filteredPayslips.find((p) => p.id === previewId) ?? filteredPayslips[0] ?? null;

  const previewEmployee = previewSlip ? employeeById[previewSlip.employee_id] : null;

  const editPayslipPeriod = useMemo(() => {
    if (!editPayslipTarget) return null;
    return periods.find((x) => x.id === editPayslipTarget.payroll_period_id) ?? null;
  }, [editPayslipTarget, periods]);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const [perRes, depts, emps] = await Promise.all([
        fetchPayrollPeriods(),
        fetchDepartments(),
        fetchAllEmployees(),
      ]);
      setPeriods(perRes.data);
      setDepartmentsList(depts);
      setEmployeesList(emps);
      setSelectedPeriodId((prev) => {
        if (prev && perRes.data.some((p) => String(p.id) === prev)) return prev;
        return perRes.data[0] ? String(perRes.data[0].id) : "";
      });
    } catch (err) {
      const msg =
        err instanceof ApiHttpError ? err.apiError?.message ?? err.message : "No se pudo cargar catálogos de nómina";
      setCatalogError(typeof msg === "string" ? msg : "Error");
      setPeriods([]);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const refreshPeriodsList = useCallback(async (selectPeriodId?: number) => {
    const perRes = await fetchPayrollPeriods();
    setPeriods(perRes.data);
    setSelectedPeriodId((prev) => {
      if (selectPeriodId != null) {
        const idStr = String(selectPeriodId);
        return perRes.data.some((p) => String(p.id) === idStr) ? idStr : prev;
      }
      if (prev && perRes.data.some((p) => String(p.id) === prev)) return prev;
      return perRes.data[0] ? String(perRes.data[0].id) : "";
    });
  }, []);

  const handleOpenPeriodDialog = () => {
    const d = new Date();
    setNewPeriodYear(String(d.getFullYear()));
    setNewPeriodMonth(String(d.getMonth() + 1));
    setPeriodDialogOpen(true);
  };

  const handleCreatePeriod = async () => {
    const y = Number.parseInt(newPeriodYear, 10);
    const mo = Number.parseInt(newPeriodMonth, 10);
    if (Number.isNaN(y) || Number.isNaN(mo) || mo < 1 || mo > 12) {
      toast({ title: "Datos inválidos", description: "Revisa año y mes.", variant: "destructive" });
      return;
    }
    setPeriodSaving(true);
    try {
      const res = await createPayrollPeriod({ year: y, month: mo });
      await refreshPeriodsList(res.data.id);
      toast({
        title: "Periodo creado",
        description: `${periodLabel(res.data)}`,
      });
      setPeriodDialogOpen(false);
    } catch (err) {
      toast({
        title: "No se pudo crear el periodo",
        description: payrollMutationErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setPeriodSaving(false);
    }
  };

  const handleOpenPayslipDialog = () => {
    if (!selectedPeriodId) {
      toast({
        title: "Elige un periodo",
        description: "Crea o selecciona un periodo de nómina antes de agregar una boleta.",
        variant: "destructive",
      });
      return;
    }
    setPayslipEmployeeId("");
    setPayslipGross("");
    setPayslipDeductions("");
    setPayslipNet("");
    setPayslipNetTouched(false);
    setPayslipApplyPrevisional(false);
    setPayslipDialogOpen(true);
  };

  const applyNetFromGrossDeductions = (grossStr: string, dedStr: string) => {
    const g = Number.parseFloat(grossStr.replace(",", ".")) || 0;
    const d = Number.parseFloat(dedStr.replace(",", ".")) || 0;
    setPayslipNet((g - d).toFixed(2));
  };

  const handlePayslipGrossChange = (value: string) => {
    setPayslipGross(value);
    if (!payslipNetTouched) applyNetFromGrossDeductions(value, payslipDeductions);
  };

  const handlePayslipDeductionsChange = (value: string) => {
    setPayslipDeductions(value);
    if (!payslipNetTouched) applyNetFromGrossDeductions(payslipGross, value);
  };

  const handlePayslipNetChange = (value: string) => {
    setPayslipNetTouched(true);
    setPayslipNet(value);
  };

  const handleCreatePayslip = async () => {
    if (!selectedPeriodId) {
      toast({ title: "Sin periodo", description: "Selecciona un periodo.", variant: "destructive" });
      return;
    }
    const empId = Number.parseInt(payslipEmployeeId, 10);
    if (Number.isNaN(empId)) {
      toast({ title: "Empleado requerido", description: "Selecciona un empleado.", variant: "destructive" });
      return;
    }
    const gross = Number.parseFloat(payslipGross.replace(",", ".")) || 0;
    const ded = Number.parseFloat(payslipDeductions.replace(",", ".")) || 0;
    const net = Number.parseFloat(payslipNet.replace(",", ".")) || 0;
    if (gross < 0 || ded < 0 || net < 0) {
      toast({ title: "Importes inválidos", description: "Los montos deben ser mayores o iguales a cero.", variant: "destructive" });
      return;
    }
    setPayslipSaving(true);
    try {
      const res = await createPayslip({
        payroll_period_id: Number(selectedPeriodId),
        employee_id: empId,
        gross_amount: gross,
        deductions_amount: ded,
        net_amount: net,
        status: "pendiente",
        apply_previsional_assist: payslipApplyPrevisional,
      });
      toast({ title: "Boleta creada", description: "El registro se guardó correctamente." });
      setPayslipDialogOpen(false);
      setPayslipReloadKey((k) => k + 1);
      setPreviewId(res.data.id);
    } catch (err) {
      toast({
        title: "No se pudo crear la boleta",
        description: payrollMutationErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setPayslipSaving(false);
    }
  };

  const applyEditNetFromGrossDeductions = (grossStr: string, dedStr: string) => {
    const g = Number.parseFloat(grossStr.replace(",", ".")) || 0;
    const d = Number.parseFloat(dedStr.replace(",", ".")) || 0;
    setEditPayslipNet((g - d).toFixed(2));
  };

  const handleOpenEditPayslip = (p: Payslip, e: MouseEvent) => {
    e.stopPropagation();
    setEditPayslipTarget(p);
    setEditPayslipGross(String(p.gross_amount));
    setEditPayslipDeductions(String(p.deductions_amount));
    setEditPayslipNet(String(p.net_amount));
    setEditPayslipNetTouched(false);
    setPayslipEditDialogOpen(true);
  };

  const handleEditPayslipGrossChange = (value: string) => {
    setEditPayslipGross(value);
    if (!editPayslipNetTouched) applyEditNetFromGrossDeductions(value, editPayslipDeductions);
  };

  const handleEditPayslipDeductionsChange = (value: string) => {
    setEditPayslipDeductions(value);
    if (!editPayslipNetTouched) applyEditNetFromGrossDeductions(editPayslipGross, value);
  };

  const handleEditPayslipNetChange = (value: string) => {
    setEditPayslipNetTouched(true);
    setEditPayslipNet(value);
  };

  const handleUpdatePayslip = async () => {
    if (!editPayslipTarget) return;
    const gross = Number.parseFloat(editPayslipGross.replace(",", ".")) || 0;
    const ded = Number.parseFloat(editPayslipDeductions.replace(",", ".")) || 0;
    const net = Number.parseFloat(editPayslipNet.replace(",", ".")) || 0;
    if (gross < 0 || ded < 0 || net < 0) {
      toast({ title: "Importes inválidos", description: "Los montos deben ser mayores o iguales a cero.", variant: "destructive" });
      return;
    }
    const payslipId = editPayslipTarget.id;
    setEditPayslipSaving(true);
    try {
      await updatePayslip(payslipId, {
        gross_amount: gross,
        deductions_amount: ded,
        net_amount: net,
      });
      toast({ title: "Boleta actualizada", description: "Los importes se guardaron correctamente." });
      setPayslipEditDialogOpen(false);
      setEditPayslipTarget(null);
      setPayslipReloadKey((k) => k + 1);
      setPreviewId(payslipId);
    } catch (err) {
      toast({
        title: "No se pudo actualizar la boleta",
        description: payrollMutationErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setEditPayslipSaving(false);
    }
  };

  const handlePayrollExportXlsx = async () => {
    if (!selectedPeriodId) {
      toast({ title: "Sin periodo", description: "Selecciona un periodo de nómina.", variant: "destructive" });
      return;
    }
    setPayrollExportBusy("xlsx");
    try {
      await downloadPayrollSummaryXlsx(Number(selectedPeriodId), areaFilter);
      toast({ title: "Exportación lista", description: "Se descargó el resumen en Excel." });
    } catch (err) {
      toast({
        title: "No se pudo exportar",
        description: payrollMutationErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setPayrollExportBusy(null);
    }
  };

  const handleDownloadPayslipPdf = async () => {
    if (!previewSlip) return;
    setPayslipPdfBusy(true);
    try {
      await downloadPayslipPdf(previewSlip.id);
      toast({ title: "PDF generado", description: "La descarga de la boleta se inició." });
    } catch (err) {
      toast({
        title: "No se pudo generar el PDF",
        description: payrollMutationErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setPayslipPdfBusy(false);
    }
  };

  const handleNotifyPayslipsForPeriod = async () => {
    if (!selectedPeriodId) {
      toast({ title: "Sin periodo", description: "Selecciona un periodo de nómina.", variant: "destructive" });
      return;
    }
    setPayrollBulkNotifyBusy(true);
    try {
      const res = await notifyPayslipsForPeriod(Number(selectedPeriodId), areaFilter);
      const n = res.data.notified_count;
      toast({
        title: "Notificaciones registradas",
        description:
          n === 0
            ? "No hay boletas en el alcance seleccionado (período y filtro de área)."
            : `Se registraron ${n} notificación${n === 1 ? "" : "es"} en el portal.`,
      });
    } catch (err) {
      toast({
        title: "No se pudieron enviar las notificaciones",
        description: payrollMutationErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setPayrollBulkNotifyBusy(false);
    }
  };

  const handlePayrollBulkZipDownload = async () => {
    if (!selectedPeriodId) {
      toast({ title: "Sin periodo", description: "Selecciona un periodo de nómina.", variant: "destructive" });
      return;
    }
    setPayrollBulkZipBusy(true);
    try {
      await downloadPayrollPayslipsZip(Number(selectedPeriodId), areaFilter);
      toast({
        title: "Descarga lista",
        description: "Se generó el ZIP con los PDF de boleta del alcance seleccionado.",
      });
    } catch (err) {
      toast({
        title: "No se pudo generar el ZIP",
        description: payrollMutationErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setPayrollBulkZipBusy(false);
    }
  };

  const handleNotifyPayslipEmployee = async () => {
    if (!previewSlip) return;
    setPayslipNotifyBusy(true);
    try {
      await notifyPayslipEmployee(previewSlip.id);
      toast({
        title: "Notificación registrada",
        description: "El empleado verá el aviso en el portal (puede haber notificaciones anteriores del mismo período).",
      });
    } catch (err) {
      toast({
        title: "No se pudo enviar la notificación",
        description: payrollMutationErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setPayslipNotifyBusy(false);
    }
  };

  const handlePayrollExportPdf = async () => {
    if (!selectedPeriodId) {
      toast({ title: "Sin periodo", description: "Selecciona un periodo de nómina.", variant: "destructive" });
      return;
    }
    setPayrollExportBusy("pdf");
    try {
      await downloadPayrollSummaryPdf(Number(selectedPeriodId), areaFilter);
      toast({ title: "Exportación lista", description: "Se descargó el resumen en PDF." });
    } catch (err) {
      toast({
        title: "No se pudo exportar",
        description: payrollMutationErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setPayrollExportBusy(null);
    }
  };

  const payrollExportDisabledReason = !canExportPayrollSummary
    ? "Requiere permisos de exportación de reportes y ver nómina"
    : !selectedPeriodId
      ? "Selecciona un periodo"
      : undefined;

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    setPreviewId(null);
  }, [selectedPeriodId]);

  useEffect(() => {
    if (!selectedPeriodId) {
      setPayslips([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setPayslipsLoading(true);
      setPayslipsError(null);
      try {
        const allSlips = await fetchAllPayslipsForPeriod(Number(selectedPeriodId));
        if (!cancelled) setPayslips(allSlips);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof ApiHttpError ? err.apiError?.message ?? err.message : "No se pudieron cargar las boletas";
          setPayslipsError(typeof msg === "string" ? msg : "Error");
          setPayslips([]);
        }
      } finally {
        if (!cancelled) setPayslipsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPeriodId, payslipReloadKey]);

  useEffect(() => {
    if (previewId != null && !filteredPayslips.some((p) => p.id === previewId)) {
      setPreviewId(null);
    }
  }, [filteredPayslips, previewId]);

  useEffect(() => {
    if (!previewSlip?.id || !selectedPeriodId) {
      setPrevisionalData(null);
      setPrevisionalError(null);
      return;
    }
    const slip = previewSlip;
    let cancelled = false;
    (async () => {
      setPrevisionalLoading(true);
      setPrevisionalError(null);
      try {
        const gross = Number.parseFloat(String(slip.gross_amount));
        const r = await fetchPrevisionalPreview({
          employee_id: slip.employee_id,
          payroll_period_id: Number(selectedPeriodId),
          gross_amount: Number.isNaN(gross) ? 0 : gross,
        });
        if (!cancelled) setPrevisionalData(r.data);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof ApiHttpError ? err.apiError?.message ?? err.message : "No se pudo cargar la sugerencia previsional";
          setPrevisionalError(typeof msg === "string" ? msg : "Error");
          setPrevisionalData(null);
        }
      } finally {
        if (!cancelled) setPrevisionalLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    previewSlip?.id,
    previewSlip?.employee_id,
    previewSlip?.gross_amount,
    selectedPeriodId,
  ]);

  const periodTitle = selectedPeriod ? periodLabel(selectedPeriod) : "—";

  if (catalogLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Boletas y Nómina</h1>
          <p className="text-sm text-muted-foreground mt-2">Cargando…</p>
        </div>
      </div>
    );
  }

  if (catalogError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Boletas y Nómina</h1>
          <p className="text-sm text-destructive mt-2">{catalogError}</p>
          <Button variant="outline" size="sm" className="mt-3" type="button" onClick={() => void loadCatalog()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Boletas y Nómina</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión de boletas de pago y planilla mensual</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            type="button"
            disabled={
              !selectedPeriodId || !canExportPayrollSummary || payrollBulkZipBusy || payrollExportBusy !== null
            }
            title={
              payrollBulkZipBusy || canExportPayrollSummary
                ? payrollExportBusy !== null
                  ? "Espera a que termine la exportación en curso"
                  : undefined
                : "Requiere permisos de exportación de reportes y ver nómina"
            }
            onClick={() => void handlePayrollBulkZipDownload()}
          >
            <Download className="w-4 h-4" />
            {payrollBulkZipBusy ? "Generando ZIP…" : "Descarga Masiva"}
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            type="button"
            disabled={
              !selectedPeriodId || !canSendPayslipNotification || payrollBulkNotifyBusy
            }
            title={
              payrollBulkNotifyBusy || canSendPayslipNotification
                ? undefined
                : "Requiere permisos de envío de nómina y ver nómina"
            }
            onClick={() => void handleNotifyPayslipsForPeriod()}
          >
            <Send className="w-4 h-4" />
            {payrollBulkNotifyBusy ? "Enviando…" : "Enviar Notificaciones"}
          </Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId} disabled={periods.length === 0}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {periodLabel(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las áreas</SelectItem>
            {departmentsList.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canGeneratePayroll ? (
          <>
            <Button type="button" size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={handleOpenPeriodDialog}>
              <Plus className="w-4 h-4" />
              Nuevo período
            </Button>
            <Button
              type="button"
              size="sm"
              variant="default"
              className="gap-1.5 shrink-0"
              disabled={!selectedPeriodId}
              onClick={handleOpenPayslipDialog}
            >
              <Plus className="w-4 h-4" />
              Nueva boleta
            </Button>
          </>
        ) : null}
      </div>

      {periods.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay periodos de nómina registrados en el sistema.</p>
      ) : null}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">
            {previewSlip && previewEmployee
              ? `Vista Previa de Boleta — ${previewEmployee.full_name}`
              : "Vista Previa de Boleta"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payslipsLoading ? (
            <p className="text-sm text-muted-foreground">Cargando boletas…</p>
          ) : payslipsError ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{payslipsError}</p>
              <Button variant="outline" size="sm" type="button" onClick={() => setPayslipReloadKey((k) => k + 1)}>
                Reintentar
              </Button>
            </div>
          ) : !previewSlip ? (
            <p className="text-sm text-muted-foreground">
              No hay boletas para este periodo{areaFilter !== "all" ? " y filtro de área" : ""}. Selecciona una fila en el
              resumen cuando existan registros.
            </p>
          ) : (
            <>
              <div className="border border-border rounded-lg p-5 space-y-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold">EnviaMas S.A.C.</p>
                    <p className="text-xs text-muted-foreground">RUC: 20123456789</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Boleta de Pago</p>
                    <p className="text-xs text-muted-foreground">Periodo: {periodTitle}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {[
                    ["Empleado", previewEmployee?.full_name ?? `#${previewSlip.employee_id}`],
                    ["DNI", previewEmployee?.dni ?? "—"],
                    ["Área", previewEmployee?.department_id != null ? (deptById[previewEmployee.department_id] ?? "—") : "—"],
                    ["Puesto", previewEmployee?.position ?? "—"],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-muted-foreground text-xs">{l}</p>
                      <p className="font-medium">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground">Estado boleta</span>
                  <Badge variant="secondary" className="text-xs">
                    {previewSlip.status}
                  </Badge>
                </div>
                <Separator />
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Sugerencia previsional (referencia)</p>
                  <p className="text-xs text-muted-foreground">
                    Cálculo asistido según parámetros legales vigentes; no modifica los importes guardados de la boleta.
                  </p>
                  {previsionalLoading ? (
                    <p className="text-xs text-muted-foreground">Cargando sugerencia…</p>
                  ) : previsionalError ? (
                    <div className="space-y-1.5">
                      <p className="text-xs text-destructive">{previsionalError}</p>
                    </div>
                  ) : previsionalData == null ? (
                    <p className="text-xs text-muted-foreground">—</p>
                  ) : previsionalData.status === "unsupported_regime" ? (
                    <p className="text-xs text-amber-800 dark:text-amber-200/90">
                      Régimen no soportado para cálculo automático
                      {previsionalData.pension_fund_original != null && previsionalData.pension_fund_original !== ""
                        ? ` (${previsionalData.pension_fund_original})`
                        : ""}
                      . Revise la ficha del empleado o cargue la boleta manualmente.
                    </p>
                  ) : previsionalData.status === "missing_legal_rate" ? (
                    <p className="text-xs text-amber-800 dark:text-amber-200/90">
                      No hay tasa legal configurada para la fecha de referencia {previsionalData.reference_date}.
                      {previsionalData.legal_parameter_key != null ? ` (${previsionalData.legal_parameter_key})` : ""}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <div>
                        <span className="text-muted-foreground">Régimen detectado</span>
                        <p className="font-medium">{regimeResolvedLabel(previsionalData.regime_resolved)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tasa aplicada</span>
                        <p className="font-medium">{formatRatioPercent(previsionalData.ratio)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Base (bruto boleta)</span>
                        <p className="font-medium">{formatPen(previsionalData.base_amount)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Monto sugerido</span>
                        <p className="font-medium text-destructive">
                          {previsionalData.amount != null ? formatPen(previsionalData.amount) : "—"}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">Fecha referencia legal</span>
                        <p className="font-medium">{previsionalData.reference_date}</p>
                      </div>
                    </div>
                  )}
                </div>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  Los importes de la boleta son los registrados en el sistema; el desglose detallado depende de
                  meta.payslip_breakdown cuando exista.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-semibold mb-2">Ingresos</p>
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">Importe bruto</span>
                      <span>{formatPen(previewSlip.gross_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1 font-semibold border-t border-border mt-1 pt-1">
                      <span>Total</span>
                      <span>{formatPen(previewSlip.gross_amount)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">Descuentos</p>
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">Total descuentos</span>
                      <span className="text-destructive">{formatPen(previewSlip.deductions_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1 font-semibold border-t border-border mt-1 pt-1">
                      <span>Total</span>
                      <span className="text-destructive">{formatPen(previewSlip.deductions_amount)}</span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Neto a Pagar</span>
                  <span className="text-primary">{formatPen(previewSlip.net_amount)}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  className="gap-1.5"
                  type="button"
                  disabled={!previewSlip || !canExportPayrollSummary || payslipPdfBusy}
                  title={
                    payslipPdfBusy || canExportPayrollSummary
                      ? undefined
                      : "Requiere permisos de exportación de reportes y ver nómina"
                  }
                  onClick={() => void handleDownloadPayslipPdf()}
                >
                  <FileText className="w-4 h-4" />
                  {payslipPdfBusy ? "Generando…" : "Generar PDF"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  type="button"
                  disabled={!previewSlip || !canSendPayslipNotification || payslipNotifyBusy}
                  title={
                    payslipNotifyBusy || canSendPayslipNotification
                      ? undefined
                      : "Requiere permisos de envío de nómina y ver nómina"
                  }
                  onClick={() => void handleNotifyPayslipEmployee()}
                >
                  <Send className="w-4 h-4" />
                  {payslipNotifyBusy ? "Enviando…" : "Enviar al Empleado"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Resumen de Nómina — {periodTitle}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              type="button"
              disabled={Boolean(payrollExportDisabledReason) || payrollExportBusy !== null}
              title={payrollExportBusy !== null ? undefined : payrollExportDisabledReason}
              onClick={() => void handlePayrollExportXlsx()}
            >
              <Download className="w-3.5 h-3.5" />
              {payrollExportBusy === "xlsx" ? "Generando…" : "Excel"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              type="button"
              disabled={Boolean(payrollExportDisabledReason) || payrollExportBusy !== null}
              title={payrollExportBusy !== null ? undefined : payrollExportDisabledReason}
              onClick={() => void handlePayrollExportPdf()}
            >
              <FileText className="w-3.5 h-3.5" />
              {payrollExportBusy === "pdf" ? "Generando…" : "PDF"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Empleado</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Área</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Bruto</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Descuentos</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Neto</th>
                {canGeneratePayroll ? (
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3 w-[1%] whitespace-nowrap">
                    Acciones
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {payslipsLoading ? (
                <tr>
                  <td colSpan={payslipTableColSpan} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Cargando boletas…
                  </td>
                </tr>
              ) : payslipsError ? (
                <tr>
                  <td colSpan={payslipTableColSpan} className="px-5 py-8 text-center">
                    <p className="text-sm text-destructive mb-2">{payslipsError}</p>
                    <Button variant="outline" size="sm" type="button" onClick={() => setPayslipReloadKey((k) => k + 1)}>
                      Reintentar
                    </Button>
                  </td>
                </tr>
              ) : filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan={payslipTableColSpan} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No hay boletas para mostrar.
                  </td>
                </tr>
              ) : (
                payslipTableRows.map((p) => {
                  const emp = employeeById[p.employee_id];
                  const area =
                    emp?.department_id != null ? (deptById[emp.department_id] ?? "—") : "—";
                  const name = emp?.full_name ?? `#${p.employee_id}`;
                  const sel = previewSlip?.id === p.id;
                  return (
                    <tr
                      key={p.id}
                      className={cn("border-b border-border last:border-0 cursor-pointer hover:bg-muted/30", sel && "bg-muted/40")}
                      onClick={() => setPreviewId(p.id)}
                    >
                      <td className="px-5 py-3 text-sm font-medium">{name}</td>
                      <td className="px-5 py-3 text-sm">{area}</td>
                      <td className="px-5 py-3 text-sm text-right">{formatPen(p.gross_amount)}</td>
                      <td className="px-5 py-3 text-sm text-right text-destructive">{formatPen(p.deductions_amount)}</td>
                      <td className="px-5 py-3 text-sm text-right font-semibold">{formatPen(p.net_amount)}</td>
                      {canGeneratePayroll ? (
                        <td
                          className="px-5 py-3 text-sm text-right align-middle"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={(e) => handleOpenEditPayslip(p, e)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {!payslipsLoading && !payslipsError ? (
            <ListPaginationBar
              page={Math.min(payslipTablePage, payslipTableLastPage)}
              lastPage={payslipTableLastPage}
              total={filteredPayslips.length}
              pageSize={PAYROLL_TABLE_SIZE}
              onPageChange={setPayslipTablePage}
            />
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo período de nómina</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Define el año y mes del periodo. No puede duplicarse un mismo año/mes.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pp-year">Año</Label>
                <Select value={newPeriodYear} onValueChange={setNewPeriodYear}>
                  <SelectTrigger id="pp-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {payrollYears.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pp-month">Mes</Label>
                <Select value={newPeriodMonth} onValueChange={setNewPeriodMonth}>
                  <SelectTrigger id="pp-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((label, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPeriodDialogOpen(false)} disabled={periodSaving}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleCreatePeriod()} disabled={periodSaving}>
              {periodSaving ? "Creando…" : "Crear período"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payslipDialogOpen} onOpenChange={setPayslipDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva boleta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedPeriod ? (
              <p className="text-sm text-muted-foreground">
                Periodo: <span className="font-medium text-foreground">{periodLabel(selectedPeriod)}</span>
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="ps-emp">Empleado</Label>
              <Select value={payslipEmployeeId} onValueChange={setPayslipEmployeeId}>
                <SelectTrigger id="ps-emp">
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employeesList.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ps-gross">Bruto</Label>
                <Input
                  id="ps-gross"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={payslipGross}
                  onChange={(e) => handlePayslipGrossChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ps-ded">Descuentos</Label>
                <Input
                  id="ps-ded"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  value={payslipDeductions}
                  onChange={(e) => handlePayslipDeductionsChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ps-net">Neto</Label>
                <Input
                  id="ps-net"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={payslipNet}
                  onChange={(e) => handlePayslipNetChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Se sugiere bruto − descuentos hasta que edites el neto manualmente.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="ps-previsional"
                checked={payslipApplyPrevisional}
                onCheckedChange={(c) => setPayslipApplyPrevisional(c === true)}
              />
              <Label htmlFor="ps-previsional" className="text-sm font-normal leading-snug cursor-pointer">
                Aplicar asistencia previsional al guardar (fusiona línea en meta según parámetros legales)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPayslipDialogOpen(false)} disabled={payslipSaving}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleCreatePayslip()} disabled={payslipSaving}>
              {payslipSaving ? "Guardando…" : "Crear boleta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={payslipEditDialogOpen}
        onOpenChange={(open) => {
          setPayslipEditDialogOpen(open);
          if (!open) setEditPayslipTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar boleta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editPayslipTarget && editPayslipPeriod ? (
              <p className="text-sm text-muted-foreground">
                Periodo: <span className="font-medium text-foreground">{periodLabel(editPayslipPeriod)}</span>
                {" · "}
                Empleado:{" "}
                <span className="font-medium text-foreground">
                  {employeeById[editPayslipTarget.employee_id]?.full_name ?? `#${editPayslipTarget.employee_id}`}
                </span>
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ps-edit-gross">Bruto</Label>
                <Input
                  id="ps-edit-gross"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={editPayslipGross}
                  onChange={(e) => handleEditPayslipGrossChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ps-edit-ded">Descuentos</Label>
                <Input
                  id="ps-edit-ded"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  value={editPayslipDeductions}
                  onChange={(e) => handleEditPayslipDeductionsChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ps-edit-net">Neto</Label>
                <Input
                  id="ps-edit-net"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={editPayslipNet}
                  onChange={(e) => handleEditPayslipNetChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Se sugiere bruto − descuentos hasta que edites el neto manualmente.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayslipEditDialogOpen(false)}
              disabled={editPayslipSaving}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleUpdatePayslip()} disabled={editPayslipSaving}>
              {editPayslipSaving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
