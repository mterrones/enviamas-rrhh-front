import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListPaginationBar } from "@/components/ListPaginationBar";
import { Users, Mail, Shield, FileText, Database, Building2, Pencil, Trash2, Copy, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { components } from "@/api/contracts";
import { ApiHttpError } from "@/api/client";
import { fetchAuditLogsPage, type AuditLogRow } from "@/api/auditLogs";
import {
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  updateDepartment,
  type Department,
} from "@/api/departments";
import { fetchRolesList } from "@/api/roles";
import {
  fetchLegalParameters,
  patchLegalParameter,
  type LegalParameterListItem,
} from "@/api/legalParameters";
import { fetchMailSettings, sendMailTest, updateMailSettings } from "@/api/mailSettings";
import { createUserInvitation, fetchUsersPage, setUserActive, updateUser, type UserAdminUpdate } from "@/api/users";
import { ROLE_LABELS, type AppRole, useAuth } from "@/contexts/AuthContext";
import { DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import { formatAppDateTime } from "@/lib/formatAppDate";

function formatAuditDate(iso: string | null): string {
  return formatAppDateTime(iso);
}

function formatAuditMeta(meta: Record<string, unknown> | null, ip: string | null): string {
  const bits: string[] = [];
  if (meta && Object.keys(meta).length > 0) {
    try {
      const s = JSON.stringify(meta);
      bits.push(s.length > 180 ? `${s.slice(0, 180)}…` : s);
    } catch {
      bits.push("(meta)");
    }
  }
  if (ip) bits.push(`IP: ${ip}`);
  return bits.length > 0 ? bits.join(" · ") : "—";
}

function roleLabel(slug: string | null | undefined, displayNameFromApi?: string | null): string {
  if (displayNameFromApi && displayNameFromApi.trim() !== "") return displayNameFromApi.trim();
  if (!slug) return "—";
  return ROLE_LABELS[slug as AppRole] ?? slug;
}

function formatUserCreatedAt(iso: string | null | undefined): string {
  return formatAppDateTime(iso);
}

function buildInviteAbsoluteUrl(invitePath: string): string {
  const path = invitePath.startsWith("/") ? invitePath : `/${invitePath}`;
  if (globalThis.window === undefined) return path;
  return `${globalThis.window.location.origin}${path}`;
}

function normalizeDeptPositionsForApi(rows: string[]): string[] {
  return rows.map(s => s.trim()).filter(s => s.length > 0);
}

function hasDuplicateDeptPositionsInsensitive(rows: string[]): boolean {
  const seen = new Set<string>();
  for (const r of rows) {
    const t = r.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) return true;
    seen.add(k);
  }
  return false;
}

type DeptPositionDraftRow = { key: string; value: string };

function newDeptPositionRow(): DeptPositionDraftRow {
  return { key: globalThis.crypto.randomUUID(), value: "" };
}

function formatApiValidationMessage(err: ApiHttpError): string {
  const ae = err.apiError;
  if (!ae) return err.message;
  if (ae.errors) {
    const first = Object.values(ae.errors).flat()[0];
    if (typeof first === "string" && first.length > 0) return first;
  }
  return ae.message;
}

function formatLegalValueForInput(unit: string, value: string | null | undefined): string {
  if (value == null || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  if (unit === "pen") return n.toFixed(2);
  return String(value).trim();
}

function parseLegalDraftForApi(unit: string, draft: string): number | null {
  const t = draft.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  if (Number.isNaN(n)) return null;
  if (unit === "pen") {
    if (n <= 0) return null;
    return n;
  }
  if (unit === "percent") {
    if (n <= 0 || n > 1) return null;
    return n;
  }
  return null;
}

function legalDraftsEqual(unit: string, draft: string, baselineFormatted: string): boolean {
  const d = draft.trim();
  const b = baselineFormatted.trim();
  if (d === b) return true;
  const nd = parseLegalDraftForApi(unit, d);
  const nb = parseLegalDraftForApi(unit, b);
  if (nd !== null && nb !== null) return nd === nb;
  return false;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { user: authUser, hasPermission } = useAuth();
  const canBackupTab = hasPermission("settings.backup");
  const canManageDepartments = hasPermission("settings.departments");
  const [activeTab, setActiveTab] = useState("usuarios");
  const [usuarios, setUsuarios] = useState<components["schemas"]["UserAdmin"][]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [usersMeta, setUsersMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: DEFAULT_LIST_PAGE_SIZE,
  });
  const [systemRoles, setSystemRoles] = useState<components["schemas"]["RoleListItem"][]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<components["schemas"]["UserAdmin"] | null>(null);
  const [userFormSubmitting, setUserFormSubmitting] = useState(false);
  const [inviteCreated, setInviteCreated] = useState<{ inviteUrl: string; expiresAt: string } | null>(null);
  const [activeToggleUserId, setActiveToggleUserId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);
  const [deptFormOpen, setDeptFormOpen] = useState(false);
  const [deptFormSaving, setDeptFormSaving] = useState(false);
  const [deptEditing, setDeptEditing] = useState<Department | null>(null);
  const [deptNameDraft, setDeptNameDraft] = useState("");
  const [deptPositionsDraft, setDeptPositionsDraft] = useState<DeptPositionDraftRow[]>([]);
  const [deptDeleteOpen, setDeptDeleteOpen] = useState(false);
  const [deptDeleteSaving, setDeptDeleteSaving] = useState(false);
  const [deptPendingDelete, setDeptPendingDelete] = useState<Department | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditMeta, setAuditMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: DEFAULT_LIST_PAGE_SIZE,
  });
  const [legalParams, setLegalParams] = useState<LegalParameterListItem[]>([]);
  const [legalAt, setLegalAt] = useState<string>("");
  const [legalDrafts, setLegalDrafts] = useState<Record<string, string>>({});
  const [legalLoading, setLegalLoading] = useState(false);
  const [legalError, setLegalError] = useState<string | null>(null);
  const [legalForbidden, setLegalForbidden] = useState(false);
  const [legalSaving, setLegalSaving] = useState(false);

  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpError, setSmtpError] = useState<string | null>(null);
  const [smtpForbidden, setSmtpForbidden] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpEncryption, setSmtpEncryption] = useState<"none" | "tls" | "ssl">("none");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFromAddress, setSmtpFromAddress] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("");
  const [smtpPasswordSet, setSmtpPasswordSet] = useState(false);
  const [smtpTestTo, setSmtpTestTo] = useState("");

  const applyMailSettingsToForm = useCallback((d: components["schemas"]["MailSettings"]) => {
    setSmtpEnabled(Boolean(d.enabled));
    setSmtpHost(d.host?.trim() ? d.host : "");
    setSmtpPort(d.port != null && d.port > 0 ? String(d.port) : "");
    const enc = d.encryption;
    setSmtpEncryption(enc === "tls" || enc === "ssl" ? enc : "none");
    setSmtpUsername(d.username?.trim() ? d.username : "");
    setSmtpPassword("");
    setSmtpFromAddress(d.from_address?.trim() ? d.from_address : "");
    setSmtpFromName(d.from_name?.trim() ? d.from_name : "");
    setSmtpPasswordSet(Boolean(d.password_set));
  }, []);

  const loadMailSettings = useCallback(async () => {
    if (!hasPermission("settings.smtp")) return;
    setSmtpLoading(true);
    setSmtpError(null);
    setSmtpForbidden(false);
    try {
      const r = await fetchMailSettings();
      applyMailSettingsToForm(r.data);
    } catch (e) {
      if (e instanceof ApiHttpError && e.status === 403) {
        setSmtpForbidden(true);
        setSmtpPasswordSet(false);
      } else {
        const msg =
          e instanceof ApiHttpError ? e.apiError?.message ?? e.message : "No se pudo cargar la configuración SMTP";
        setSmtpError(typeof msg === "string" ? msg : "No se pudo cargar la configuración SMTP");
        toast({
          title: "SMTP",
          description: typeof msg === "string" ? msg : "Error al cargar",
          variant: "destructive",
        });
      }
    } finally {
      setSmtpLoading(false);
    }
  }, [applyMailSettingsToForm, hasPermission, toast]);

  useEffect(() => {
    if (activeTab !== "smtp") return;
    if (!hasPermission("settings.smtp")) return;
    void loadMailSettings();
  }, [activeTab, hasPermission, loadMailSettings]);

  const loadDepartments = useCallback(async () => {
    setDepartmentsLoading(true);
    setDepartmentsError(null);
    try {
      const list = await fetchDepartments();
      setDepartments(list);
    } catch (e) {
      const msg =
        e instanceof ApiHttpError
          ? e.apiError?.message ?? e.message
          : "No se pudieron cargar las áreas";
      setDepartmentsError(typeof msg === "string" ? msg : "No se pudieron cargar las áreas");
      setDepartments([]);
      toast({ title: "Áreas", description: typeof msg === "string" ? msg : "Error al cargar", variant: "destructive" });
    } finally {
      setDepartmentsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const r = await fetchAuditLogsPage({ page: auditPage, per_page: DEFAULT_LIST_PAGE_SIZE });
      setAuditLogs(r.data);
      setAuditMeta({
        current_page: r.meta.current_page,
        last_page: r.meta.last_page,
        total: r.meta.total,
        per_page: r.meta.per_page,
      });
    } catch (e) {
      const msg =
        e instanceof ApiHttpError ? e.apiError?.message ?? e.message : "No se pudo cargar la auditoría";
      setAuditError(typeof msg === "string" ? msg : "No se pudo cargar la auditoría");
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }, [auditPage]);

  useEffect(() => {
    if (activeTab === "auditoria") {
      loadAuditLogs();
    }
  }, [activeTab, loadAuditLogs]);

  const loadLegalParams = useCallback(async () => {
    if (!hasPermission("settings.params")) return;
    setLegalLoading(true);
    setLegalError(null);
    setLegalForbidden(false);
    try {
      const r = await fetchLegalParameters();
      setLegalParams(r.data);
      setLegalAt(r.at);
      const drafts: Record<string, string> = {};
      for (const p of r.data) {
        drafts[p.key] = formatLegalValueForInput(p.unit, p.value ?? undefined);
      }
      setLegalDrafts(drafts);
    } catch (e) {
      if (e instanceof ApiHttpError && e.status === 403) {
        setLegalForbidden(true);
        setLegalParams([]);
        setLegalDrafts({});
      } else {
        const msg =
          e instanceof ApiHttpError ? e.apiError?.message ?? e.message : "No se pudieron cargar los parámetros";
        setLegalError(typeof msg === "string" ? msg : "No se pudieron cargar los parámetros");
        setLegalParams([]);
        setLegalDrafts({});
      }
    } finally {
      setLegalLoading(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    if (activeTab !== "parametros") return;
    if (!hasPermission("settings.params")) return;
    void loadLegalParams();
  }, [activeTab, hasPermission, loadLegalParams]);

  useEffect(() => {
    if (activeTab === "backup" && !canBackupTab) {
      setActiveTab("usuarios");
    }
  }, [activeTab, canBackupTab]);

  const loadUsersTab = useCallback(async () => {
    setUsersLoading(true);
    setRolesLoading(true);
    setUsersError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetchUsersPage({ page: usersPage, per_page: DEFAULT_LIST_PAGE_SIZE }),
        fetchRolesList(),
      ]);
      setUsuarios(usersRes.data);
      setUsersMeta({
        current_page: usersRes.meta.current_page ?? 1,
        last_page: usersRes.meta.last_page ?? 1,
        total: usersRes.meta.total ?? 0,
        per_page: usersRes.meta.per_page ?? DEFAULT_LIST_PAGE_SIZE,
      });
      setSystemRoles(rolesRes.data);
    } catch (e) {
      const msg =
        e instanceof ApiHttpError ? e.apiError?.message ?? e.message : "No se pudieron cargar los usuarios";
      setUsersError(typeof msg === "string" ? msg : "No se pudieron cargar los usuarios");
      setUsuarios([]);
      setSystemRoles([]);
      toast({
        title: "Usuarios",
        description: typeof msg === "string" ? msg : "Error al cargar",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
      setRolesLoading(false);
    }
  }, [usersPage, toast]);

  useEffect(() => {
    if (activeTab === "usuarios") {
      void loadUsersTab();
    }
  }, [activeTab, loadUsersTab]);

  // Form fields
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const resetForm = () => {
    setNombre("");
    setEmail("");
    setRol("");
    setDepartmentId("");
  };

  useEffect(() => {
    if (!userFormOpen) return;
    if (editingUser) {
      setNombre(editingUser.name);
      setEmail(editingUser.email);
      setRol(editingUser.role ?? "");
      setDepartmentId(editingUser.department_id != null ? String(editingUser.department_id) : "");
    } else {
      resetForm();
    }
  }, [userFormOpen, editingUser]);

  const handleGuardar = async () => {
    const isEdit = editingUser != null;
    if (isEdit) {
      if (!nombre.trim() || !email.trim() || !rol) {
        toast({ title: "Campos obligatorios", description: "Completa nombre, email y rol.", variant: "destructive" });
        return;
      }
    } else {
      if (!email.trim() || !rol) {
        toast({ title: "Campos obligatorios", description: "Completa email y rol.", variant: "destructive" });
        return;
      }
    }
    if (rol === "jefe_area" && !departmentId) {
      toast({ title: "Campo obligatorio", description: "Selecciona el área para el Jefe de Área.", variant: "destructive" });
      return;
    }
    const roleRow = systemRoles.find((r) => r.slug === rol);
    if (!roleRow) {
      toast({ title: "Rol", description: "Selecciona un rol válido.", variant: "destructive" });
      return;
    }

    setUserFormSubmitting(true);
    try {
      if (isEdit && editingUser) {
        const body: UserAdminUpdate = {
          name: nombre.trim(),
          email: email.trim(),
          role_id: roleRow.id,
          department_id: rol === "jefe_area" ? Number.parseInt(departmentId, 10) : null,
        };
        await updateUser(editingUser.id, body);
        toast({ title: "Usuario actualizado", description: "Los cambios se guardaron correctamente." });
      } else {
        const inv = await createUserInvitation({
          email: email.trim(),
          role_id: roleRow.id,
          department_id: rol === "jefe_area" ? Number.parseInt(departmentId, 10) : null,
        });
        const inviteUrl = buildInviteAbsoluteUrl(inv.data.invite_path);
        setInviteCreated({ inviteUrl, expiresAt: inv.data.expires_at });
        toast({
          title: "Invitación creada",
          description: "Comparte el enlace con el usuario para que complete el registro con Google.",
        });
        resetForm();
        if (usersPage !== 1) {
          setUsersPage(1);
        } else {
          await loadUsersTab();
        }
        return;
      }
      setUserFormOpen(false);
      setEditingUser(null);
      resetForm();
      await loadUsersTab();
    } catch (e) {
      const msg =
        e instanceof ApiHttpError
          ? formatApiValidationMessage(e)
          : isEdit
            ? "No se pudo actualizar el usuario"
            : "No se pudo crear la invitación";
      toast({
        title: isEdit ? "Error al actualizar usuario" : "Error al crear invitación",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setUserFormSubmitting(false);
    }
  };

  const handleSaveLegalParams = async () => {
    if (!hasPermission("settings.params")) return;
    const atStr = legalAt;
    setLegalSaving(true);
    try {
      for (const p of legalParams) {
        const baseline = formatLegalValueForInput(p.unit, p.value ?? undefined);
        if (legalDraftsEqual(p.unit, legalDrafts[p.key] ?? "", baseline)) continue;
        const num = parseLegalDraftForApi(p.unit, legalDrafts[p.key] ?? "");
        if (num === null) {
          toast({
            title: "Valor no válido",
            description: `Revisa ${p.label_es}. Los montos en soles deben ser mayores que cero; las tasas son ratio entre 0 y 1 (ej. 0.10).`,
            variant: "destructive",
          });
          return;
        }
        const eff = p.effective_from ?? atStr;
        if (!eff) {
          toast({
            title: "Parámetro incompleto",
            description: `No se pudo determinar la vigencia para ${p.label_es}.`,
            variant: "destructive",
          });
          return;
        }
        await patchLegalParameter(p.key, { value: num, effective_from: eff });
      }
      toast({ title: "Parámetros guardados", description: "Los cambios se aplicaron correctamente." });
      await loadLegalParams();
    } catch (e) {
      if (e instanceof ApiHttpError && e.status === 403) {
        setLegalForbidden(true);
        toast({
          title: "Sin permiso",
          description: "No puedes guardar estos parámetros.",
          variant: "destructive",
        });
      } else {
        const msg = e instanceof ApiHttpError ? formatApiValidationMessage(e) : "No se pudieron guardar los cambios";
        toast({ title: "Error al guardar", description: msg, variant: "destructive" });
      }
    } finally {
      setLegalSaving(false);
    }
  };

  const handleSaveSmtp = async () => {
    if (!hasPermission("settings.smtp")) return;
    let port: number | null = null;
    if (smtpPort.trim() !== "") {
      const n = Number.parseInt(smtpPort.trim(), 10);
      if (Number.isNaN(n) || n < 1 || n > 65535) {
        toast({
          title: "Puerto no válido",
          description: "Indica un puerto entre 1 y 65535 o déjalo vacío.",
          variant: "destructive",
        });
        return;
      }
      port = n;
    }
    const body: components["schemas"]["MailSettingsWrite"] = {
      enabled: smtpEnabled,
      host: smtpHost.trim() || null,
      port,
      encryption: smtpEncryption === "none" ? null : smtpEncryption,
      username: smtpUsername.trim() || null,
      from_address: smtpFromAddress.trim() || null,
      from_name: smtpFromName.trim() || null,
    };
    const pw = smtpPassword.trim();
    if (pw !== "") {
      body.password = pw;
    }
    setSmtpSaving(true);
    try {
      const r = await updateMailSettings(body);
      applyMailSettingsToForm(r.data);
      toast({ title: "Configuración guardada", description: "Los ajustes SMTP se actualizaron correctamente." });
    } catch (e) {
      if (e instanceof ApiHttpError && e.status === 403) {
        setSmtpForbidden(true);
        toast({
          title: "Sin permiso",
          description: "No puedes guardar la configuración SMTP.",
          variant: "destructive",
        });
      } else {
        const msg =
          e instanceof ApiHttpError ? formatApiValidationMessage(e) : "No se pudieron guardar los cambios";
        toast({ title: "Error al guardar", description: msg, variant: "destructive" });
      }
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleSendSmtpTest = async () => {
    if (!hasPermission("settings.smtp")) return;
    const to = smtpTestTo.trim();
    if (!to) {
      toast({
        title: "Correo de prueba",
        description: "Indica la dirección de correo destino.",
        variant: "destructive",
      });
      return;
    }
    setSmtpTesting(true);
    try {
      await sendMailTest(to);
      toast({ title: "Correo enviado", description: `Se envió un mensaje de prueba a ${to}.` });
    } catch (e) {
      if (e instanceof ApiHttpError && e.status === 403) {
        setSmtpForbidden(true);
        toast({
          title: "Sin permiso",
          description: "No puedes enviar correos de prueba.",
          variant: "destructive",
        });
      } else {
        const msg =
          e instanceof ApiHttpError ? formatApiValidationMessage(e) : "No se pudo enviar el correo de prueba";
        toast({ title: "Error en prueba SMTP", description: msg, variant: "destructive" });
      }
    } finally {
      setSmtpTesting(false);
    }
  };

  const openDeptCreate = () => {
    setDeptEditing(null);
    setDeptNameDraft("");
    setDeptPositionsDraft([]);
    setDeptFormOpen(true);
  };

  const openDeptEdit = (d: Department) => {
    setDeptEditing(d);
    setDeptNameDraft(d.name);
    setDeptPositionsDraft(
      d.positions?.length
        ? d.positions.map(p => ({ key: `db-${p.id}`, value: p.name }))
        : [],
    );
    setDeptFormOpen(true);
  };

  const openDeptDelete = (d: Department) => {
    setDeptPendingDelete(d);
    setDeptDeleteOpen(true);
  };

  const handleDeptFormSave = async () => {
    const name = deptNameDraft.trim();
    if (!name) {
      toast({ title: "Área", description: "Indica un nombre para el área.", variant: "destructive" });
      return;
    }
    const positionValues = deptPositionsDraft.map(r => r.value);
    if (hasDuplicateDeptPositionsInsensitive(positionValues)) {
      toast({
        title: "Puestos",
        description: "No puedes repetir el mismo nombre de puesto en el listado.",
        variant: "destructive",
      });
      return;
    }
    const positions = normalizeDeptPositionsForApi(positionValues);
    setDeptFormSaving(true);
    try {
      if (deptEditing) {
        await updateDepartment(deptEditing.id, { name, positions });
        toast({ title: "Área actualizada", description: "Los cambios se guardaron correctamente." });
      } else {
        await createDepartment({ name, positions });
        toast({ title: "Área creada", description: "El departamento se registró correctamente." });
      }
      setDeptFormOpen(false);
      setDeptEditing(null);
      setDeptNameDraft("");
      setDeptPositionsDraft([]);
      await loadDepartments();
    } catch (e) {
      const msg = e instanceof ApiHttpError ? formatApiValidationMessage(e) : "No se pudo guardar el área";
      toast({ title: "Área", description: msg, variant: "destructive" });
    } finally {
      setDeptFormSaving(false);
    }
  };

  const handleDeptDeleteConfirm = async () => {
    if (!deptPendingDelete) return;
    setDeptDeleteSaving(true);
    try {
      await deleteDepartment(deptPendingDelete.id);
      toast({ title: "Área eliminada", description: `Se eliminó «${deptPendingDelete.name}».` });
      setDeptDeleteOpen(false);
      setDeptPendingDelete(null);
      await loadDepartments();
    } catch (e) {
      const msg =
        e instanceof ApiHttpError ? formatApiValidationMessage(e) : "No se pudo eliminar el área";
      toast({ title: "No se puede eliminar", description: msg, variant: "destructive" });
    } finally {
      setDeptDeleteSaving(false);
    }
  };

  const handleToggleActive = async (row: components["schemas"]["UserAdmin"], nextActive: boolean) => {
    setActiveToggleUserId(row.id);
    try {
      await setUserActive(row.id, nextActive);
      toast({
        title: nextActive ? "Usuario reactivado" : "Usuario desactivado",
        description: nextActive
          ? "El usuario puede volver a iniciar sesión."
          : "El usuario quedó inactivo y sus sesiones se cerraron.",
      });
      await loadUsersTab();
    } catch (e) {
      const msg = e instanceof ApiHttpError ? formatApiValidationMessage(e) : "No se pudo actualizar el estado";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setActiveToggleUserId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Administración del sistema — Solo Superadmin RRHH</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="usuarios" className="gap-1.5"><Users className="w-4 h-4" />Usuarios</TabsTrigger>
          <TabsTrigger value="areas" className="gap-1.5"><Building2 className="w-4 h-4" />Áreas</TabsTrigger>
          <TabsTrigger value="smtp" className="gap-1.5"><Mail className="w-4 h-4" />SMTP</TabsTrigger>
          <TabsTrigger value="parametros" className="gap-1.5"><Shield className="w-4 h-4" />Parámetros</TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-1.5"><FileText className="w-4 h-4" />Auditoría</TabsTrigger>
          {canBackupTab ? (
            <TabsTrigger value="backup" className="gap-1.5"><Database className="w-4 h-4" />Backup</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="usuarios" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Gestión de Usuarios</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => void loadUsersTab()}
                  disabled={usersLoading}
                >
                  Actualizar
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setInviteCreated(null);
                    setUserFormOpen(true);
                  }}
                >
                  Nuevo Usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {usersLoading ? (
                <p className="text-sm text-muted-foreground px-5 py-8">Cargando…</p>
              ) : usersError ? (
                <div className="px-5 py-8 space-y-3">
                  <p className="text-sm text-destructive">{usersError}</p>
                  <Button size="sm" variant="outline" type="button" onClick={() => void loadUsersTab()}>
                    Reintentar
                  </Button>
                </div>
              ) : usuarios.length === 0 ? (
                <p className="text-sm text-muted-foreground px-5 py-8">No hay usuarios para mostrar.</p>
              ) : (
                <>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        {["Nombre", "Email", "Rol", "Estado", "Registro", "Acciones"].map((h) => (
                          <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((u) => (
                        <tr key={u.id} className="border-b border-border last:border-0">
                          <td className="px-5 py-3 text-sm font-medium">{u.name}</td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{u.email}</td>
                          <td className="px-5 py-3">
                            <Badge variant="secondary" className="text-xs">
                              {roleLabel(u.role ?? undefined)}
                            </Badge>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant={u.is_active ? "default" : "secondary"} className="text-xs">
                              {u.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                            {formatUserCreatedAt(u.created_at ?? undefined)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-primary"
                                type="button"
                                onClick={() => {
                                  setInviteCreated(null);
                                  setEditingUser(u);
                                  setUserFormOpen(true);
                                }}
                              >
                                Editar
                              </Button>
                              {u.is_active ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  type="button"
                                  disabled={
                                    activeToggleUserId === u.id ||
                                    (authUser != null && Number(authUser.id) === u.id)
                                  }
                                  title={
                                    authUser != null && Number(authUser.id) === u.id
                                      ? "No puedes desactivar tu propia cuenta"
                                      : undefined
                                  }
                                  onClick={() => void handleToggleActive(u, false)}
                                >
                                  {activeToggleUserId === u.id ? "…" : "Desactivar"}
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  type="button"
                                  disabled={activeToggleUserId === u.id}
                                  onClick={() => void handleToggleActive(u, true)}
                                >
                                  {activeToggleUserId === u.id ? "…" : "Reactivar"}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {usersMeta.total > 0 ? (
                    <ListPaginationBar
                      page={usersMeta.current_page}
                      lastPage={usersMeta.last_page}
                      total={usersMeta.total}
                      pageSize={usersMeta.per_page}
                      loading={usersLoading}
                      onPageChange={setUsersPage}
                    />
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="areas" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Áreas (departamentos)</CardTitle>
              <div className="flex flex-wrap gap-2 justify-end">
                {canManageDepartments ? (
                  <Button size="sm" type="button" onClick={() => openDeptCreate()}>
                    Nueva área
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" type="button" onClick={() => loadDepartments()} disabled={departmentsLoading}>
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {departmentsLoading ? (
                <p className="text-sm text-muted-foreground px-5 py-8">Cargando…</p>
              ) : departmentsError ? (
                <div className="px-5 py-8 space-y-3">
                  <p className="text-sm text-destructive">{departmentsError}</p>
                  <Button size="sm" variant="outline" type="button" onClick={() => loadDepartments()}>
                    Reintentar
                  </Button>
                </div>
              ) : departments.length === 0 ? (
                <p className="text-sm text-muted-foreground px-5 py-8">No hay áreas registradas en el sistema.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">ID</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Área</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Puestos</th>
                      {canManageDepartments ? (
                        <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Acciones</th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((d) => (
                      <tr key={d.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3 text-sm text-muted-foreground tabular-nums">{d.id}</td>
                        <td className="px-5 py-3 text-sm font-medium">{d.name}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground tabular-nums">
                          {d.positions?.length ?? 0}
                        </td>
                        {canManageDepartments ? (
                          <td className="px-5 py-3 text-right">
                            <div className="inline-flex gap-1.5 justify-end">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 px-2"
                                onClick={() => openDeptEdit(d)}
                              >
                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                Editar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-destructive border-destructive/40 hover:bg-destructive/10"
                                onClick={() => openDeptDelete(d)}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Eliminar
                              </Button>
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smtp" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">Configuración SMTP</CardTitle>
              {hasPermission("settings.smtp") ? (
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => void loadMailSettings()}
                  disabled={smtpLoading || smtpSaving || smtpTesting}
                >
                  Actualizar
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              {!hasPermission("settings.smtp") ? (
                <p className="text-sm text-muted-foreground">
                  No tienes permiso para ver ni editar la configuración SMTP.
                </p>
              ) : smtpForbidden ? (
                <p className="text-sm text-destructive">
                  No tienes permiso para acceder a la configuración SMTP.
                </p>
              ) : smtpLoading ? (
                <p className="text-sm text-muted-foreground">Cargando…</p>
              ) : smtpError ? (
                <div className="space-y-3">
                  <p className="text-sm text-destructive">{smtpError}</p>
                  <Button size="sm" variant="outline" type="button" onClick={() => void loadMailSettings()}>
                    Reintentar
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Usar SMTP configurado en la aplicación</Label>
                      <p className="text-xs text-muted-foreground">
                        Si está desactivado, el envío usa la configuración por defecto del servidor.
                      </p>
                    </div>
                    <Switch checked={smtpEnabled} onCheckedChange={setSmtpEnabled} disabled={smtpSaving} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Host SMTP</Label>
                    <Input
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      disabled={smtpSaving}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Puerto</Label>
                    <Input
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      disabled={smtpSaving}
                      inputMode="numeric"
                      placeholder="587"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Cifrado</Label>
                    <Select
                      value={smtpEncryption}
                      onValueChange={(v) => setSmtpEncryption(v as "none" | "tls" | "ssl")}
                      disabled={smtpSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Cifrado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguno</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Usuario</Label>
                    <Input
                      value={smtpUsername}
                      onChange={(e) => setSmtpUsername(e.target.value)}
                      disabled={smtpSaving}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Contraseña</Label>
                    <Input
                      type="password"
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      disabled={smtpSaving}
                      placeholder={smtpPasswordSet ? "Dejar vacío para no cambiar" : "Opcional"}
                      autoComplete="new-password"
                    />
                    {smtpPasswordSet ? (
                      <p className="text-xs text-muted-foreground">
                        Hay una contraseña guardada. Déjala en blanco para conservarla.
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Correo remitente</Label>
                    <Input
                      type="email"
                      value={smtpFromAddress}
                      onChange={(e) => setSmtpFromAddress(e.target.value)}
                      disabled={smtpSaving}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Nombre remitente</Label>
                    <Input
                      value={smtpFromName}
                      onChange={(e) => setSmtpFromName(e.target.value)}
                      disabled={smtpSaving}
                      autoComplete="off"
                    />
                  </div>
                  <Button size="sm" type="button" disabled={smtpSaving || smtpTesting} onClick={() => void handleSaveSmtp()}>
                    {smtpSaving ? "Guardando…" : "Guardar configuración"}
                  </Button>
                  <Separator />
                  <div className="space-y-1.5">
                    <Label className="text-sm">Enviar correo de prueba</Label>
                    <Input
                      type="email"
                      value={smtpTestTo}
                      onChange={(e) => setSmtpTestTo(e.target.value)}
                      disabled={smtpSaving || smtpTesting}
                      placeholder="destino@ejemplo.com"
                      autoComplete="off"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    disabled={smtpSaving || smtpTesting}
                    onClick={() => void handleSendSmtpTest()}
                  >
                    {smtpTesting ? "Enviando…" : "Enviar prueba"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parametros" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Parámetros Legales</CardTitle>
              {hasPermission("settings.params") ? (
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => void loadLegalParams()}
                  disabled={legalLoading || legalSaving}
                >
                  Actualizar
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              {!hasPermission("settings.params") ? (
                <p className="text-sm text-muted-foreground">
                  No tienes permiso para ver ni editar los parámetros legales.
                </p>
              ) : legalForbidden ? (
                <p className="text-sm text-destructive">No tienes permiso para acceder a estos parámetros.</p>
              ) : legalLoading ? (
                <p className="text-sm text-muted-foreground">Cargando…</p>
              ) : legalError ? (
                <div className="space-y-3">
                  <p className="text-sm text-destructive">{legalError}</p>
                  <Button size="sm" variant="outline" type="button" onClick={() => void loadLegalParams()}>
                    Reintentar
                  </Button>
                </div>
              ) : legalParams.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay parámetros legales en el catálogo.</p>
              ) : (
                <>
                  {legalAt ? (
                    <p className="text-xs text-muted-foreground">Valores vigentes al {legalAt}.</p>
                  ) : null}
                  {legalParams.map((p: LegalParameterListItem) => (
                    <div key={p.key} className="space-y-1.5">
                      <Label className="text-sm">{p.label_es}</Label>
                      {p.description ? (
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      ) : null}
                      {p.effective_from ? (
                        <p className="text-xs text-muted-foreground">Vigencia desde {p.effective_from}</p>
                      ) : null}
                      <Input
                        value={legalDrafts[p.key] ?? ""}
                        onChange={(e) =>
                          setLegalDrafts((prev) => ({ ...prev, [p.key]: e.target.value }))
                        }
                        disabled={legalSaving}
                        placeholder={p.unit === "pen" ? "0.00" : "0.00–1"}
                        inputMode="decimal"
                      />
                      {p.unit === "percent" ? (
                        <p className="text-xs text-muted-foreground">Ratio entre 0 y 1 (ej. 0.10 = 10%).</p>
                      ) : null}
                    </div>
                  ))}
                  <Button
                    size="sm"
                    type="button"
                    disabled={
                      legalSaving ||
                      legalLoading ||
                      !legalParams.some((p) => {
                        const baseline = formatLegalValueForInput(p.unit, p.value ?? undefined);
                        return !legalDraftsEqual(p.unit, legalDrafts[p.key] ?? "", baseline);
                      })
                    }
                    onClick={() => void handleSaveLegalParams()}
                  >
                    {legalSaving ? "Guardando…" : "Guardar Parámetros"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Registro de Auditoría</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {auditLoading ? (
                <p className="text-sm text-muted-foreground px-5 py-8">Cargando…</p>
              ) : auditError ? (
                <div className="px-5 py-8 space-y-3">
                  <p className="text-sm text-destructive">{auditError}</p>
                  <Button size="sm" variant="outline" type="button" onClick={() => loadAuditLogs()}>
                    Reintentar
                  </Button>
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground px-5 py-8">No hay eventos de auditoría registrados.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {["Fecha", "Usuario", "Acción", "Recurso", "ID", "Metadatos"].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(l => (
                      <tr key={l.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatAuditDate(l.created_at)}
                        </td>
                        <td className="px-5 py-3 text-sm max-w-[140px] break-words">
                          {l.user?.name?.trim() || l.user?.email || "—"}
                        </td>
                        <td className="px-5 py-3 text-sm font-medium">{l.action}</td>
                        <td className="px-5 py-3 text-sm">{l.resource_type}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground tabular-nums">
                          {l.resource_id != null ? l.resource_id : "—"}
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground max-w-md break-words">
                          {formatAuditMeta(l.meta, l.ip_address)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!auditLoading && !auditError && auditMeta.total > 0 ? (
                <ListPaginationBar
                  page={auditMeta.current_page}
                  lastPage={auditMeta.last_page}
                  total={auditMeta.total}
                  pageSize={auditMeta.per_page}
                  loading={auditLoading}
                  onPageChange={setAuditPage}
                />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {canBackupTab ? (
          <TabsContent value="backup" className="mt-4">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base">Backup y Restauración</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  El respaldo y la restauración de la base de datos no están disponibles desde esta aplicación. Deben
                  configurarse y ejecutarse en el entorno de servidor o con las herramientas del proveedor de
                  infraestructura (copias programadas, almacenamiento externo, procedimientos de restauración).
                </p>
                <Separator />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Estado actual</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>La auditoría funcional de acciones de usuario sigue disponible en la pestaña Auditoría.</li>
                    <li>
                      Tareas automáticas del sistema (por ejemplo recordatorios de contratos) registran eventos técnicos
                      en el log operativo del servidor (<span className="font-mono text-xs">storage/logs/operations-*.log</span>).
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>

      {/* Dialog Nuevo / Editar usuario */}
      <Dialog
        open={userFormOpen}
        onOpenChange={(open) => {
          if (!open && userFormSubmitting) return;
          if (!open) {
            resetForm();
            setEditingUser(null);
            setInviteCreated(null);
          }
          setUserFormOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {inviteCreated
                ? "Invitación lista"
                : editingUser
                  ? "Editar usuario"
                  : "Invitar usuario"}
            </DialogTitle>
          </DialogHeader>
          {inviteCreated ? (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Comparte este enlace. El usuario debe registrarse con Google usando el mismo correo invitado. Caduca:{" "}
                {formatUserCreatedAt(inviteCreated.expiresAt)}
              </p>
              <div className="flex gap-2">
                <Input readOnly value={inviteCreated.inviteUrl} className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  title="Copiar enlace"
                  onClick={() => {
                    void navigator.clipboard.writeText(inviteCreated.inviteUrl).then(() => {
                      toast({ title: "Copiado", description: "El enlace está en el portapapeles." });
                    });
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : null}
          {!inviteCreated ? (
          <div className="space-y-4 py-2">
            {editingUser ? (
              <div className="space-y-1.5">
                <Label className="text-sm">Nombre completo *</Label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: María García"
                  disabled={userFormSubmitting}
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label className="text-sm">Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@enviam.as"
                disabled={userFormSubmitting}
              />
              {!editingUser ? (
                <p className="text-xs text-muted-foreground">Debe coincidir con la cuenta Google del invitado.</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Rol *</Label>
              <Select
                value={rol}
                onValueChange={(v) => {
                  setRol(v);
                  if (v !== "jefe_area") setDepartmentId("");
                }}
                disabled={rolesLoading || systemRoles.length === 0 || userFormSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={rolesLoading ? "Cargando roles…" : "Seleccionar rol"} />
                </SelectTrigger>
                <SelectContent>
                  {systemRoles.map((r) => (
                    <SelectItem key={r.id} value={r.slug}>
                      {roleLabel(r.slug, r.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!rolesLoading && systemRoles.length === 0 ? (
                <p className="text-xs text-muted-foreground">No hay roles en el servidor. Ejecuta el seed RBAC o revisa permisos.</p>
              ) : null}
            </div>
            {rol === "jefe_area" && (
              <div className="space-y-1.5">
                <Label className="text-sm">Área *</Label>
                <Select
                  value={departmentId}
                  onValueChange={setDepartmentId}
                  disabled={departmentsLoading || !!departmentsError || userFormSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={departmentsLoading ? "Cargando áreas…" : "Seleccionar área"} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!departmentsLoading && !departmentsError && departments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No hay áreas en el servidor. Registra departamentos en la base de datos.</p>
                ) : null}
              </div>
            )}
          </div>
          ) : null}
          <DialogFooter>
            {inviteCreated ? (
              <Button
                onClick={() => {
                  setInviteCreated(null);
                  resetForm();
                  setUserFormOpen(false);
                }}
              >
                Cerrar
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  disabled={userFormSubmitting}
                  onClick={() => {
                    resetForm();
                    setEditingUser(null);
                    setUserFormOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button disabled={userFormSubmitting} onClick={() => void handleGuardar()}>
                  {userFormSubmitting ? "Guardando…" : editingUser ? "Guardar cambios" : "Crear invitación"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deptFormOpen}
        onOpenChange={(open) => {
          if (!open && deptFormSaving) return;
          if (!open) {
            setDeptEditing(null);
            setDeptNameDraft("");
            setDeptPositionsDraft([]);
          }
          setDeptFormOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{deptEditing ? "Editar área" : "Nueva área"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Nombre del área *</Label>
              <Input
                value={deptNameDraft}
                onChange={(e) => setDeptNameDraft(e.target.value)}
                placeholder="Ej: Operaciones"
                disabled={deptFormSaving}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Puestos del área</Label>
              <p className="text-xs text-muted-foreground">
                Opcional. Cargos habituales de esta área; puedes añadir varios (máx. 50). No podrás quitar un puesto si
                algún empleado del área tiene ese cargo en su ficha (campo Puesto).
              </p>
              <div className="space-y-2">
                {deptPositionsDraft.map(row => (
                  <div key={row.key} className="flex gap-2 items-center">
                    <Input
                      value={row.value}
                      onChange={e => {
                        const v = e.target.value;
                        setDeptPositionsDraft(prev =>
                          prev.map(x => (x.key === row.key ? { ...x, value: v } : x)),
                        );
                      }}
                      placeholder="Ej: Supervisor"
                      disabled={deptFormSaving}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      disabled={deptFormSaving}
                      onClick={() => setDeptPositionsDraft(prev => prev.filter(x => x.key !== row.key))}
                      aria-label="Quitar puesto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                disabled={deptFormSaving || deptPositionsDraft.length >= 50}
                onClick={() => setDeptPositionsDraft(prev => [...prev, newDeptPositionRow()])}
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir puesto
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              disabled={deptFormSaving}
              onClick={() => {
                setDeptFormOpen(false);
                setDeptEditing(null);
                setDeptNameDraft("");
                setDeptPositionsDraft([]);
              }}
            >
              Cancelar
            </Button>
            <Button type="button" disabled={deptFormSaving} onClick={() => void handleDeptFormSave()}>
              {deptFormSaving ? "Guardando…" : deptEditing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deptDeleteOpen}
        onOpenChange={(open) => {
          if (!open && deptDeleteSaving) return;
          if (!open) setDeptPendingDelete(null);
          setDeptDeleteOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar área</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            {deptPendingDelete
              ? `¿Eliminar el área «${deptPendingDelete.name}»? Esta acción no se puede deshacer. Si hay empleados o usuarios vinculados, el sistema no permitirá el borrado.`
              : null}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              disabled={deptDeleteSaving}
              onClick={() => {
                setDeptDeleteOpen(false);
                setDeptPendingDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deptDeleteSaving || !deptPendingDelete}
              onClick={() => void handleDeptDeleteConfirm()}
            >
              {deptDeleteSaving ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
