import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ApiHttpError } from "@/api/client";
import { formatHttpErrorMessage } from "@/api/httpErrorMessage";
import { fetchDepartments } from "@/api/departments";
import {
  createEmployee,
  fetchEmployee,
  fetchAllEmployees,
  updateEmployee,
  type Employee,
  type EmployeeWrite,
} from "@/api/employees";
import { uploadEmployeeDocument, type EmployeeDocumentType } from "@/api/employeeDocuments";
import { fetchEmployeePhotoBlob, uploadEmployeePhoto } from "@/api/employeePhotos";
import type { components } from "@/api/contracts";

type FormDocumentSlot = Extract<
  EmployeeDocumentType,
  "antecedentes" | "cv" | "medical_exam" | "contract"
>;

const formDocumentSlots: FormDocumentSlot[] = ["antecedentes", "cv", "medical_exam", "contract"];

const formDocumentLabels: Record<FormDocumentSlot, string> = {
  antecedentes: "Antecedentes",
  cv: "CV",
  medical_exam: "Examen médico",
  contract: "Contrato",
};

function emptyPendingDocuments(): Record<FormDocumentSlot, File | null> {
  return {
    antecedentes: null,
    cv: null,
    medical_exam: null,
    contract: null,
  };
}

async function uploadPendingEmployeeDocuments(
  employeeId: number,
  files: Record<FormDocumentSlot, File | null>,
): Promise<FormDocumentSlot[]> {
  const failed: FormDocumentSlot[] = [];
  for (const slot of formDocumentSlots) {
    const file = files[slot];
    if (!file) {
      continue;
    }
    try {
      await uploadEmployeeDocument(employeeId, slot, file);
    } catch {
      failed.push(slot);
    }
  }
  return failed;
}

const puestos = ["Operador", "Supervisor", "Jefe de Área", "Desarrolladora", "Soporte TI", "Asistente RRHH", "QA Tester"];
const bancos = ["BCP", "BBVA", "Interbank", "Scotiabank", "BanBif", "Caja Arequipa"];
const previsiones = ["AFP Integra", "AFP Prima", "AFP Profuturo", "AFP Habitat", "ONP"];
const contratos = ["Plazo Fijo", "Indefinido", "Locación de Servicios"];
const modalidades = ["Full-time", "Part-time"];
const estados = ["activo", "suspendido", "vacaciones", "cesado"];
const estudios = ["Secundaria", "Técnico", "Universitario", "Postgrado"];

function customCatalogOptionItem(value: string, known: string[]) {
  if (!value || known.includes(value)) return null;
  return (
    <SelectItem key={`__custom_${value}`} value={value}>
      {value}
    </SelectItem>
  );
}

export type EmployeeFormMode = "create" | "edit";

type FormState = {
  nombre: string;
  dni: string;
  fechaNacimiento: string;
  nivelEstudios: string;
  carrera: string;
  telefono: string;
  correo: string;
  direccion: string;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTelefono: string;
  banco: string;
  numeroCuenta: string;
  prevision: string;
  puesto: string;
  departmentId: string;
  modalidad: string;
  horario: string;
  sueldo: string;
  tipoContrato: string;
  fechaInicio: string;
  fechaFin: string;
  managerId: string;
  estado: string;
};

function emptyForm(): FormState {
  return {
    nombre: "",
    dni: "",
    fechaNacimiento: "",
    nivelEstudios: "",
    carrera: "",
    telefono: "",
    correo: "",
    direccion: "",
    contactoEmergenciaNombre: "",
    contactoEmergenciaTelefono: "",
    banco: "",
    numeroCuenta: "",
    prevision: "",
    puesto: "",
    departmentId: "__no_dept__",
    modalidad: "",
    horario: "",
    sueldo: "",
    tipoContrato: "",
    fechaInicio: "",
    fechaFin: "",
    managerId: "__none__",
    estado: "activo",
  };
}

function toInputDate(val?: string | null): string {
  if (!val) return "";
  return val.length >= 10 ? val.slice(0, 10) : val;
}

function employeeToForm(e: Employee): FormState {
  return {
    nombre: e.full_name ?? "",
    dni: e.dni ?? "",
    fechaNacimiento: toInputDate(e.birth_date),
    nivelEstudios: e.education_level ?? "",
    carrera: e.degree ?? "",
    telefono: e.phone ?? "",
    correo: e.personal_email ?? "",
    direccion: e.address ?? "",
    contactoEmergenciaNombre: e.emergency_contact_name ?? "",
    contactoEmergenciaTelefono: e.emergency_contact_phone ?? "",
    banco: e.bank ?? "",
    numeroCuenta: e.bank_account ?? "",
    prevision: e.pension_fund ?? "",
    puesto: e.position ?? "",
    departmentId: e.department_id != null ? String(e.department_id) : "__no_dept__",
    modalidad: e.modality ?? "",
    horario: e.schedule ?? "",
    sueldo: e.salary != null && e.salary !== "" ? String(e.salary) : "",
    tipoContrato: e.contract_type ?? "",
    fechaInicio: toInputDate(e.contract_start),
    fechaFin: toInputDate(e.contract_end),
    managerId: e.manager_id != null ? String(e.manager_id) : "__none__",
    estado: e.status ?? "activo",
  };
}

function buildPayloadForCreate(form: FormState): EmployeeWrite {
  const salaryNum = form.sueldo.trim() === "" ? undefined : Number(form.sueldo);
  const payload: EmployeeWrite = {
    full_name: form.nombre.trim(),
    dni: form.dni.trim(),
    status: form.estado as components["schemas"]["EmployeeStatus"],
  };
  if (form.departmentId && form.departmentId !== "__no_dept__") payload.department_id = Number(form.departmentId);
  if (form.managerId && form.managerId !== "__none__") payload.manager_id = Number(form.managerId);
  if (form.fechaNacimiento) payload.birth_date = form.fechaNacimiento;
  if (form.nivelEstudios) payload.education_level = form.nivelEstudios;
  if (form.carrera) payload.degree = form.carrera;
  if (form.telefono) payload.phone = form.telefono;
  if (form.correo) payload.personal_email = form.correo;
  if (form.direccion) payload.address = form.direccion;
  if (form.contactoEmergenciaNombre) payload.emergency_contact_name = form.contactoEmergenciaNombre;
  if (form.contactoEmergenciaTelefono) payload.emergency_contact_phone = form.contactoEmergenciaTelefono;
  if (form.banco) payload.bank = form.banco;
  if (form.numeroCuenta) payload.bank_account = form.numeroCuenta;
  if (form.prevision) payload.pension_fund = form.prevision;
  if (form.puesto) payload.position = form.puesto;
  if (form.modalidad) payload.modality = form.modalidad;
  if (form.horario) payload.schedule = form.horario;
  if (salaryNum != null && !Number.isNaN(salaryNum)) payload.salary = salaryNum;
  if (form.tipoContrato) payload.contract_type = form.tipoContrato;
  if (form.fechaInicio) payload.contract_start = form.fechaInicio;
  if (form.fechaFin) payload.contract_end = form.fechaFin;
  return payload;
}

function buildPayloadForUpdate(form: FormState): EmployeeWrite {
  const salaryNum = form.sueldo.trim() === "" ? undefined : Number(form.sueldo);
  const payload: EmployeeWrite = {
    full_name: form.nombre.trim(),
    dni: form.dni.trim(),
    status: form.estado as components["schemas"]["EmployeeStatus"],
  };
  payload.department_id =
    form.departmentId && form.departmentId !== "__no_dept__" ? Number(form.departmentId) : null;
  payload.manager_id =
    form.managerId && form.managerId !== "__none__" ? Number(form.managerId) : null;
  payload.birth_date = form.fechaNacimiento || null;
  payload.education_level = form.nivelEstudios || null;
  payload.degree = form.carrera || null;
  payload.phone = form.telefono || null;
  payload.personal_email = form.correo || null;
  payload.address = form.direccion || null;
  payload.emergency_contact_name = form.contactoEmergenciaNombre || null;
  payload.emergency_contact_phone = form.contactoEmergenciaTelefono || null;
  payload.bank = form.banco || null;
  payload.bank_account = form.numeroCuenta || null;
  payload.pension_fund = form.prevision || null;
  payload.position = form.puesto || null;
  payload.modality = form.modalidad || null;
  payload.schedule = form.horario || null;
  payload.salary = salaryNum != null && !Number.isNaN(salaryNum) ? salaryNum : null;
  payload.contract_type = form.tipoContrato || null;
  payload.contract_start = form.fechaInicio || null;
  payload.contract_end = form.fechaFin || null;
  return payload;
}

type EmployeeFormPageProps = {
  mode: EmployeeFormMode;
  employeeId?: number;
};

export function EmployeeFormPage({ mode, employeeId }: EmployeeFormPageProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  const setPreviewUrl = useCallback((url: string | null) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (url) {
      previewUrlRef.current = url;
    }
    setFotoPreview(url);
  }, []);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [managers, setManagers] = useState<{ id: number; full_name: string }[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [recordLoading, setRecordLoading] = useState(mode === "edit");
  const [recordError, setRecordError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pendingDocuments, setPendingDocuments] = useState(emptyPendingDocuments);

  const handlePendingDocChange = (slot: FormDocumentSlot) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    setPendingDocuments((prev) => ({ ...prev, [slot]: f }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      setFotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const depts = await fetchDepartments();
      setDepartments(depts.map((d) => ({ id: d.id, name: d.name })));
      if (mode === "create") {
        const emps = await fetchAllEmployees();
        setManagers(emps.map((e) => ({ id: e.id, full_name: e.full_name })));
      }
    } catch {
      toast({
        title: "Catálogos",
        description: "No se pudieron cargar áreas o lista de jefes. Revisa la conexión.",
        variant: "destructive",
      });
    } finally {
      setCatalogLoading(false);
    }
  }, [toast, mode]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (mode !== "edit" || employeeId == null) return undefined;

    let cancelled = false;
    setRecordLoading(true);
    setRecordError(null);
    (async () => {
      try {
        const [empRes, depts] = await Promise.all([fetchEmployee(employeeId), fetchDepartments()]);
        if (cancelled) return;
        const e = empRes.data;
        setFotoFile(null);
        setForm(employeeToForm(e));
        setDepartments(depts.map((d) => ({ id: d.id, name: d.name })));

        if (e.photo_path) {
          try {
            const blob = await fetchEmployeePhotoBlob(employeeId);
            if (!cancelled) {
              setPreviewUrl(URL.createObjectURL(blob));
            }
          } catch {
            if (!cancelled) {
              setPreviewUrl(null);
            }
          }
        } else if (!cancelled) {
          setPreviewUrl(null);
        }

        const emps = await fetchAllEmployees();
        if (cancelled) return;
        let list = emps.filter((x) => x.id !== employeeId).map((x) => ({ id: x.id, full_name: x.full_name }));

        if (e.manager_id != null && !list.some((m) => m.id === e.manager_id)) {
          try {
            const mgr = await fetchEmployee(e.manager_id);
            if (!cancelled) list = [...list, { id: mgr.data.id, full_name: mgr.data.full_name }];
          } catch {
            /* omit */
          }
        }
        if (!cancelled) setManagers(list);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof ApiHttpError ? err.apiError?.message ?? err.message : "No se pudo cargar el empleado";
          setRecordError(typeof msg === "string" ? msg : "Error al cargar");
        }
      } finally {
        if (!cancelled) setRecordLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, employeeId, reloadKey, setPreviewUrl]);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.dni.trim()) {
      toast({ title: "Campos obligatorios", description: "Nombre y DNI son obligatorios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (mode === "create") {
        const res = await createEmployee(buildPayloadForCreate(form));
        const newId = res.data.id;
        const failed = await uploadPendingEmployeeDocuments(newId, pendingDocuments);
        setPendingDocuments(emptyPendingDocuments());
        let photoUploadFailed = false;
        let photoErrorDetail: string | null = null;
        if (fotoFile) {
          try {
            await uploadEmployeePhoto(newId, fotoFile);
          } catch (e) {
            photoUploadFailed = true;
            photoErrorDetail = formatHttpErrorMessage(e);
          }
        }
        if (failed.length > 0) {
          toast({
            title: "Empleado creado",
            description: `No se pudieron subir: ${failed.map((s) => formDocumentLabels[s]).join(", ")}.${photoUploadFailed ? ` La foto tampoco: ${photoErrorDetail ?? "error"}.` : ""} Puedes subirlos desde el perfil del empleado.`,
            variant: "destructive",
          });
        } else if (photoUploadFailed) {
          toast({
            title: "Empleado creado",
            description: `${form.nombre.trim()} fue registrado, pero la foto no se pudo subir: ${photoErrorDetail ?? "error"}. Puedes intentarlo desde la edición.`,
            variant: "destructive",
          });
        } else {
          toast({ title: "Empleado creado", description: `${form.nombre.trim()} fue registrado correctamente.` });
        }
        navigate(`/empleados/${newId}`);
      } else if (employeeId != null) {
        const payload = buildPayloadForUpdate(form);
        await updateEmployee(employeeId, payload);
        const failed = await uploadPendingEmployeeDocuments(employeeId, pendingDocuments);
        setPendingDocuments(emptyPendingDocuments());
        let photoUploadFailed = false;
        let photoErrorDetail: string | null = null;
        if (fotoFile) {
          try {
            await uploadEmployeePhoto(employeeId, fotoFile);
          } catch (e) {
            photoUploadFailed = true;
            photoErrorDetail = formatHttpErrorMessage(e);
          }
        }
        if (failed.length > 0) {
          toast({
            title: "Cambios guardados",
            description: `No se pudieron subir: ${failed.map((s) => formDocumentLabels[s]).join(", ")}.${photoUploadFailed ? ` La foto tampoco: ${photoErrorDetail ?? "error"}.` : ""} Reintenta desde el perfil.`,
            variant: "destructive",
          });
        } else if (photoUploadFailed) {
          toast({
            title: "Cambios guardados",
            description: `Los datos se actualizaron, pero la foto no se pudo subir: ${photoErrorDetail ?? "error"}. Puedes intentarlo de nuevo.`,
            variant: "destructive",
          });
        } else {
          toast({ title: "Cambios guardados", description: "Los datos del empleado se actualizaron correctamente." });
        }
        navigate(`/empleados/${employeeId}`);
      }
    } catch (e) {
      toast({
        title: "Error",
        description: formatHttpErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const isBusyInitial = mode === "edit" && (recordLoading || catalogLoading);
  const estadoLabel = mode === "create" ? "Estado inicial" : "Estado";
  const primaryCta = mode === "create" ? "Guardar Empleado" : "Guardar cambios";
  const title = mode === "create" ? "Nuevo Empleado" : "Editar empleado";
  const subtitle =
    mode === "create" ? "Complete la información del nuevo colaborador" : "Actualice la información del colaborador";

  if (mode === "edit" && recordError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link to="/empleados">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver a empleados
          </Button>
        </Link>
        <Card className="shadow-card">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <p className="text-destructive mb-4">{recordError}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRecordError(null);
                setReloadKey((k) => k + 1);
              }}
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to={mode === "edit" && employeeId != null ? `/empleados/${employeeId}` : "/empleados"}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> {mode === "edit" ? "Volver al perfil" : "Volver a empleados"}
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      </div>

      {isBusyInitial ? (
        <p className="text-sm text-muted-foreground py-8">Cargando datos…</p>
      ) : (
        <>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Datos Personales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border overflow-hidden">
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Foto del empleado" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" />
                <Button variant="outline" size="sm" type="button" onClick={() => fileInputRef.current?.click()}>
                  {fotoPreview ? "Cambiar foto" : "Subir foto"}
                </Button>
                {fotoPreview ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setFotoFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    Quitar
                  </Button>
                ) : null}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nombre completo</Label>
                  <Input placeholder="Ej: Juan Pérez García" value={form.nombre} onChange={(e) => update("nombre", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>DNI</Label>
                  <Input placeholder="Ej: 72345678" maxLength={16} value={form.dni} onChange={(e) => update("dni", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de nacimiento</Label>
                  <Input type="date" value={form.fechaNacimiento} onChange={(e) => update("fechaNacimiento", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nivel de estudios</Label>
                  <Select value={form.nivelEstudios} onValueChange={(v) => update("nivelEstudios", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {customCatalogOptionItem(form.nivelEstudios, estudios)}
                      {estudios.map((x) => (
                        <SelectItem key={x} value={x}>
                          {x}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Carrera / Especialidad</Label>
                  <Input placeholder="Ej: Ing. Sistemas" value={form.carrera} onChange={(e) => update("carrera", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>Antecedentes policiales (PDF)</Label>
                  <Input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="cursor-pointer"
                    onChange={handlePendingDocChange("antecedentes")}
                  />
                  {pendingDocuments.antecedentes ? (
                    <p className="text-xs text-muted-foreground truncate">{pendingDocuments.antecedentes.name}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>CV (PDF)</Label>
                  <Input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="cursor-pointer"
                    onChange={handlePendingDocChange("cv")}
                  />
                  {pendingDocuments.cv ? (
                    <p className="text-xs text-muted-foreground truncate">{pendingDocuments.cv.name}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Examen Médico Ocupacional (PDF)</Label>
                  <Input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="cursor-pointer"
                    onChange={handlePendingDocChange("medical_exam")}
                  />
                  {pendingDocuments.medical_exam ? (
                    <p className="text-xs text-muted-foreground truncate">{pendingDocuments.medical_exam.name}</p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Datos de Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input placeholder="Ej: 987654321" value={form.telefono} onChange={(e) => update("telefono", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Correo electrónico</Label>
                  <Input type="email" placeholder="Ej: juan@enviamas.pe" value={form.correo} onChange={(e) => update("correo", e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <Label>Dirección</Label>
                  <Input placeholder="Ej: Av. Principal 123, Lima" value={form.direccion} onChange={(e) => update("direccion", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Contacto de emergencia — Nombre</Label>
                  <Input placeholder="Ej: Rosa Pérez" value={form.contactoEmergenciaNombre} onChange={(e) => update("contactoEmergenciaNombre", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Contacto de emergencia — Teléfono</Label>
                  <Input placeholder="Ej: 912345678" value={form.contactoEmergenciaTelefono} onChange={(e) => update("contactoEmergenciaTelefono", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Datos Bancarios y Previsionales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Banco</Label>
                  <Select value={form.banco} onValueChange={(v) => update("banco", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {customCatalogOptionItem(form.banco, bancos)}
                      {bancos.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número de cuenta</Label>
                  <Input placeholder="Ej: 19112345678901" value={form.numeroCuenta} onChange={(e) => update("numeroCuenta", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sistema previsional</Label>
                  <Select value={form.prevision} onValueChange={(v) => update("prevision", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {customCatalogOptionItem(form.prevision, previsiones)}
                      {previsiones.map((p) => (
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

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Datos Laborales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Área</Label>
                  <Select value={form.departmentId} onValueChange={(v) => update("departmentId", v)} disabled={catalogLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={catalogLoading ? "Cargando áreas…" : "Seleccionar área"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__no_dept__">Sin área asignada</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Puesto</Label>
                  <Select value={form.puesto} onValueChange={(v) => update("puesto", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar puesto" />
                    </SelectTrigger>
                    <SelectContent>
                      {customCatalogOptionItem(form.puesto, puestos)}
                      {puestos.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Modalidad</Label>
                  <Select value={form.modalidad} onValueChange={(v) => update("modalidad", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {customCatalogOptionItem(form.modalidad, modalidades)}
                      {modalidades.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Horario laboral</Label>
                  <Input placeholder="Ej: 09:00 - 18:00" value={form.horario} onChange={(e) => update("horario", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sueldo (S/)</Label>
                  <Input type="number" placeholder="Ej: 2500" value={form.sueldo} onChange={(e) => update("sueldo", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de contrato</Label>
                  <Select value={form.tipoContrato} onValueChange={(v) => update("tipoContrato", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {customCatalogOptionItem(form.tipoContrato, contratos)}
                      {contratos.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de inicio</Label>
                  <Input type="date" value={form.fechaInicio} onChange={(e) => update("fechaInicio", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha fin de contrato</Label>
                  <Input type="date" value={form.fechaFin} onChange={(e) => update("fechaFin", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Jefe directo</Label>
                  <Select value={form.managerId} onValueChange={(v) => update("managerId", v)} disabled={catalogLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={catalogLoading ? "Cargando…" : "Seleccionar jefe"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin jefe asignado</SelectItem>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{estadoLabel}</Label>
                  <Select value={form.estado} onValueChange={(v) => update("estado", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map((x) => (
                        <SelectItem key={x} value={x}>
                          {x.charAt(0).toUpperCase() + x.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Label>Contrato (PDF)</Label>
                <Input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="cursor-pointer max-w-md"
                  onChange={handlePendingDocChange("contract")}
                />
                {pendingDocuments.contract ? (
                  <p className="text-xs text-muted-foreground truncate">{pendingDocuments.contract.name}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pb-6">
            <Link to={mode === "edit" && employeeId != null ? `/empleados/${employeeId}` : "/empleados"}>
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button className="gap-2" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" /> {saving ? "Guardando…" : primaryCta}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
