import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ApiHttpError } from "@/api/client";
import { ListPaginationBar } from "@/components/ListPaginationBar";
import { DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import { fetchAllEmployees } from "@/api/employees";
import { createAsset, fetchAssetsPage, type Asset, type AssetListParams } from "@/api/assets";
import { useAuth } from "@/contexts/AuthContext";

const estadoVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "En uso": "default",
  Asignado: "default",
  "En mantenimiento": "secondary",
  Devuelto: "outline",
  Disponible: "secondary",
};

type StatusFilterKey = "todos" | "uso" | "mant" | "dev";

function statusFilterToApi(key: StatusFilterKey): string | undefined {
  if (key === "todos") return undefined;
  if (key === "uso") return "En uso";
  if (key === "mant") return "En mantenimiento";
  return "Devuelto";
}

function displayDescription(a: Asset): string {
  const d = a.description?.trim();
  if (d) return d;
  const parts = [a.brand, a.model].filter(Boolean);
  return parts.length ? parts.join(" ") : "—";
}

function formatAssignedDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("es-PE");
  } catch {
    return iso;
  }
}

export default function AssetsPage() {
  const { hasPermission } = useAuth();
  const canManageAssets = hasPermission("assets.manage");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("todos");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employeeMap, setEmployeeMap] = useState<Record<number, string>>({});
  const [employees, setEmployees] = useState<{ id: number; full_name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [assetsMeta, setAssetsMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: DEFAULT_LIST_PAGE_SIZE,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegistrar, setShowRegistrar] = useState(false);
  const { toast } = useToast();

  const [tipo, setTipo] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [empleado, setEmpleado] = useState("__none__");
  const [estado, setEstado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const st = statusFilterToApi(statusFilter);
      const params: AssetListParams = { per_page: DEFAULT_LIST_PAGE_SIZE, page };
      if (st) params.status = st;
      if (debouncedSearch) params.search = debouncedSearch;
      const [aRes, allEmps] = await Promise.all([fetchAssetsPage(params), fetchAllEmployees()]);
      setAssets(aRes.data);
      setAssetsMeta({
        current_page: aRes.meta.current_page ?? page,
        last_page: aRes.meta.last_page ?? 1,
        total: aRes.meta.total ?? 0,
        per_page: aRes.meta.per_page ?? DEFAULT_LIST_PAGE_SIZE,
      });
      setEmployees(allEmps.map((e) => ({ id: e.id, full_name: e.full_name })));
      const m: Record<number, string> = {};
      allEmps.forEach((e) => {
        m[e.id] = e.full_name;
      });
      setEmployeeMap(m);
    } catch (err) {
      const msg = err instanceof ApiHttpError ? err.apiError?.message ?? err.message : "No se pudieron cargar los activos";
      setError(typeof msg === "string" ? msg : "Error");
      setAssets([]);
      setAssetsMeta((m) => ({ ...m, total: 0, last_page: 1, current_page: 1 }));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, page]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetForm = () => {
    setTipo("");
    setMarca("");
    setModelo("");
    setSerie("");
    setEmpleado("__none__");
    setEstado("");
    setObservaciones("");
  };

  const handleGuardar = async () => {
    if (!tipo || !modelo.trim()) {
      toast({ title: "Campos requeridos", description: "Tipo y Modelo/Descripción son obligatorios.", variant: "destructive" });
      return;
    }
    const descCombined = [marca, modelo].filter(Boolean).join(" ").trim() || null;
    const empId = empleado !== "__none__" ? Number(empleado) : null;
    if (empleado !== "__none__" && Number.isNaN(empId)) {
      toast({ title: "Error", description: "Empleado no válido.", variant: "destructive" });
      return;
    }
    const st = estado || "Disponible";
    setSaving(true);
    try {
      await createAsset({
        type: tipo,
        brand: marca.trim() || null,
        model: modelo.trim() || null,
        serial_number: serie.trim() || null,
        description: descCombined,
        employee_id: empId,
        status: st,
        observations: observaciones.trim() || null,
        assigned_at: empId != null ? format(new Date(), "yyyy-MM-dd") : null,
      });
      toast({
        title: "Activo registrado",
        description: `${descCombined ?? modelo.trim()} se registró correctamente.`,
      });
      setShowRegistrar(false);
      resetForm();
      await loadData();
    } catch (err) {
      const msg = err instanceof ApiHttpError ? err.apiError?.message ?? err.message : "No se pudo registrar el activo";
      toast({ title: "Error", description: typeof msg === "string" ? msg : "Intenta de nuevo", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const closeRegistrar = (open: boolean) => {
    setShowRegistrar(open);
    if (!open) resetForm();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Activos y Equipos</h1>
          <p className="text-muted-foreground text-sm mt-1">Control de equipos asignados al personal</p>
        </div>
        {canManageAssets ? (
          <Button className="gap-2" type="button" onClick={() => setShowRegistrar(true)}>
            <Plus className="w-4 h-4" />
            Registrar Activo
          </Button>
        ) : null}
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar equipo o empleado..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilterKey)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="uso">En uso</SelectItem>
              <SelectItem value="mant">En mantenimiento</SelectItem>
              <SelectItem value="dev">Devuelto</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Tipo", "Descripción", "Empleado", "Fecha Asignación", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-sm text-muted-foreground text-center">
                    Cargando activos…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="text-sm text-destructive mb-2">{error}</p>
                    <Button variant="outline" size="sm" type="button" onClick={() => void loadData()}>
                      Reintentar
                    </Button>
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-sm text-muted-foreground text-center">
                    No hay activos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                assets.map((a) => {
                  const empName = a.employee_id != null ? (employeeMap[a.employee_id] ?? `#${a.employee_id}`) : "—";
                  return (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-3 text-sm font-medium">{a.type}</td>
                      <td className="px-5 py-3 text-sm">{displayDescription(a)}</td>
                      <td className="px-5 py-3 text-sm">{empName}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{formatAssignedDate(a.assigned_at)}</td>
                      <td className="px-5 py-3">
                        <Badge variant={estadoVariant[a.status] ?? "secondary"} className="text-xs">
                          {a.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary gap-1"
                          type="button"
                          disabled
                          title="La API no incluye subida de acta PDF"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Acta PDF
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && !error ? (
          <ListPaginationBar
            page={assetsMeta.current_page}
            lastPage={assetsMeta.last_page}
            total={assetsMeta.total}
            pageSize={assetsMeta.per_page}
            onPageChange={setPage}
          />
        ) : null}
      </Card>

      <Dialog open={showRegistrar} onOpenChange={closeRegistrar}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Activo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de activo *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {["Laptop", "Monitor", "Headset", "Teclado", "Mouse", "Otro"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input placeholder="Ej: Lenovo, Dell..." value={marca} onChange={(e) => setMarca(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Modelo / Descripción *</Label>
                <Input placeholder="Ej: ThinkPad T14" value={modelo} onChange={(e) => setModelo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Número de serie</Label>
                <Input placeholder="Ej: SN-123456" value={serie} onChange={(e) => setSerie(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Empleado asignado</Label>
                <Select value={empleado} onValueChange={setEmpleado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin asignar</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Disponible" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Disponible", "En uso", "Asignado", "En mantenimiento"].map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                placeholder="Notas adicionales sobre el activo..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" disabled={saving} onClick={() => closeRegistrar(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleGuardar()} disabled={saving}>
              {saving ? "Guardando…" : "Registrar Activo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
