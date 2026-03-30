import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { FileText, Calendar as CalendarIcon, Bell, User, Download } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const myBoletas = [
  { periodo: "Marzo 2026", monto: "S/ 2,175.00", estado: "Nueva" },
  { periodo: "Febrero 2026", monto: "S/ 2,175.00", estado: "Confirmada" },
  { periodo: "Enero 2026", monto: "S/ 2,175.00", estado: "Confirmada" },
];

const myNotifications = [
  { titulo: "Boleta disponible", desc: "Tu boleta de marzo 2026 está lista", fecha: "Hoy" },
  { titulo: "Solicitud aprobada", desc: "Tu permiso del 20/03 fue aprobado", fecha: "Ayer" },
];

type Solicitud = {
  tipo: string;
  fechas: string;
  estado: string;
};

const initialRequests: Solicitud[] = [
  { tipo: "Vacaciones", fechas: "10/04 — 14/04/2026", estado: "Pendiente" },
  { tipo: "Permiso", fechas: "20/03/2026", estado: "Aprobado" },
];

export default function EmployeePortalPage() {
  const { toast } = useToast();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(initialRequests);
  const [showNuevaSolicitud, setShowNuevaSolicitud] = useState(false);

  // Form state
  const [tipoSolicitud, setTipoSolicitud] = useState("");
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>();
  const [fechaFin, setFechaFin] = useState<Date | undefined>();
  const [hora, setHora] = useState("");
  const [justificacion, setJustificacion] = useState("");

  const diasCalculados =
    tipoSolicitud === "Vacaciones" && fechaInicio && fechaFin
      ? Math.max(differenceInCalendarDays(fechaFin, fechaInicio) + 1, 0)
      : 0;

  const resetForm = () => {
    setTipoSolicitud("");
    setFechaInicio(undefined);
    setFechaFin(undefined);
    setHora("");
    setJustificacion("");
  };

  const handleGuardar = () => {
    if (!tipoSolicitud) return;
    if (!fechaInicio) return;
    if (tipoSolicitud === "Vacaciones" && !fechaFin) return;
    if (["Falta", "Tardanza", "Salida Temprana"].includes(tipoSolicitud) && !justificacion.trim()) return;
    if (["Tardanza", "Salida Temprana"].includes(tipoSolicitud) && !hora) return;

    let fechasStr = format(fechaInicio, "dd/MM/yyyy");
    if (tipoSolicitud === "Vacaciones" && fechaFin) {
      fechasStr = `${format(fechaInicio, "dd/MM/yyyy")} — ${format(fechaFin, "dd/MM/yyyy")}`;
    }
    if (["Tardanza", "Salida Temprana"].includes(tipoSolicitud)) {
      fechasStr += ` (${hora})`;
    }

    setSolicitudes((prev) => [
      { tipo: tipoSolicitud, fechas: fechasStr, estado: "Pendiente" },
      ...prev,
    ]);
    setShowNuevaSolicitud(false);
    resetForm();
    toast({ title: "Solicitud enviada", description: `Tu solicitud de ${tipoSolicitud.toLowerCase()} fue registrada correctamente.` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Portal del Empleado</h1>
        <p className="text-muted-foreground text-sm mt-1">Bienvenido, Juan Pérez</p>
      </div>

      <Tabs defaultValue="boletas">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="boletas" className="gap-1.5"><FileText className="w-4 h-4" />Mis Boletas</TabsTrigger>
          <TabsTrigger value="asistencia" className="gap-1.5"><CalendarIcon className="w-4 h-4" />Mis Asistencias</TabsTrigger>
          <TabsTrigger value="solicitudes" className="gap-1.5"><User className="w-4 h-4" />Mis Solicitudes</TabsTrigger>
          <TabsTrigger value="notificaciones" className="gap-1.5"><Bell className="w-4 h-4" />Notificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="boletas" className="mt-4">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Mis Boletas de Pago</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Periodo</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Neto</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Estado</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Acciones</th>
                </tr></thead>
                <tbody>
                  {myBoletas.map((b) => (
                    <tr key={b.periodo} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-sm font-medium">{b.periodo}</td>
                      <td className="px-5 py-3 text-sm">{b.monto}</td>
                      <td className="px-5 py-3"><Badge variant={b.estado === "Confirmada" ? "default" : "secondary"} className="text-xs">{b.estado}</Badge></td>
                      <td className="px-5 py-3 flex gap-2">
                        <Button variant="ghost" size="sm" className="text-xs text-primary gap-1"><Download className="w-3.5 h-3.5" />PDF</Button>
                        {b.estado === "Nueva" && <Button size="sm" className="text-xs h-7">Confirmar Recepción</Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asistencia" className="mt-4">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Mi Asistencia — Marzo 2026</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">El calendario personal de asistencia se muestra aquí con los mismos indicadores de color del módulo de asistencia.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {[["Días Asistidos", "22"], ["Faltas", "1"], ["Tardanzas", "2"], ["Horas Extra", "4h"]].map(([l, v]) => (
                  <div key={l} className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{v}</p><p className="text-xs text-muted-foreground mt-1">{l}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solicitudes" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Mis Solicitudes</CardTitle>
              <Button size="sm" className="gap-1.5" onClick={() => setShowNuevaSolicitud(true)}>Nueva Solicitud</Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Tipo</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Fechas</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Estado</th>
                </tr></thead>
                <tbody>
                  {solicitudes.map((r, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-sm font-medium">{r.tipo}</td>
                      <td className="px-5 py-3 text-sm">{r.fechas}</td>
                      <td className="px-5 py-3"><Badge variant={r.estado === "Aprobado" ? "default" : "secondary"} className="text-xs">{r.estado}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificaciones" className="mt-4">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Notificaciones</CardTitle></CardHeader>
            <CardContent className="p-0 divide-y divide-border">
              {myNotifications.map((n, i) => (
                <div key={i} className="px-5 py-4">
                  <p className="text-sm font-medium">{n.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.fecha}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Nueva Solicitud */}
      <Dialog open={showNuevaSolicitud} onOpenChange={(open) => { setShowNuevaSolicitud(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo de solicitud</Label>
              <Select value={tipoSolicitud} onValueChange={(v) => { setTipoSolicitud(v); setFechaFin(undefined); setHora(""); }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Falta">Falta</SelectItem>
                  <SelectItem value="Tardanza">Tardanza</SelectItem>
                  <SelectItem value="Salida Temprana">Salida Temprana</SelectItem>
                  <SelectItem value="Vacaciones">Vacaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha (todos los tipos) */}
            {tipoSolicitud && (
              <div className="space-y-2">
                <Label>{tipoSolicitud === "Vacaciones" ? "Fecha de inicio" : "Fecha"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !fechaInicio && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaInicio ? format(fechaInicio, "dd/MM/yyyy") : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fechaInicio} onSelect={setFechaInicio} initialFocus className="p-3 pointer-events-auto" locale={es} />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Fecha fin (solo vacaciones) */}
            {tipoSolicitud === "Vacaciones" && (
              <div className="space-y-2">
                <Label>Fecha de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !fechaFin && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaFin ? format(fechaFin, "dd/MM/yyyy") : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fechaFin} onSelect={setFechaFin} initialFocus className="p-3 pointer-events-auto" locale={es} disabled={(date) => fechaInicio ? date < fechaInicio : false} />
                  </PopoverContent>
                </Popover>
                {diasCalculados > 0 && (
                  <p className="text-sm text-muted-foreground">Total: {diasCalculados} día{diasCalculados !== 1 ? "s" : ""}</p>
                )}
              </div>
            )}

            {/* Hora (tardanza / salida temprana) */}
            {["Tardanza", "Salida Temprana"].includes(tipoSolicitud) && (
              <div className="space-y-2">
                <Label>{tipoSolicitud === "Tardanza" ? "Hora de llegada" : "Hora de salida"}</Label>
                <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
              </div>
            )}

            {/* Justificación / Observaciones */}
            {tipoSolicitud && (
              <div className="space-y-2">
                <Label>
                  {tipoSolicitud === "Vacaciones" ? "Observaciones (opcional)" : "Justificación"}
                  {tipoSolicitud !== "Vacaciones" && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Textarea
                  placeholder={tipoSolicitud === "Vacaciones" ? "Observaciones adicionales..." : "Describe el motivo de tu solicitud..."}
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNuevaSolicitud(false); resetForm(); }}>Cancelar</Button>
            <Button
              onClick={handleGuardar}
              disabled={
                !tipoSolicitud ||
                !fechaInicio ||
                (tipoSolicitud === "Vacaciones" && !fechaFin) ||
                (["Falta", "Tardanza", "Salida Temprana"].includes(tipoSolicitud) && !justificacion.trim()) ||
                (["Tardanza", "Salida Temprana"].includes(tipoSolicitud) && !hora)
              }
            >
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
