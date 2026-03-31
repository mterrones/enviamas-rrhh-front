import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarCheck, FileText, Download, CalendarIcon, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const statusColorMap: Record<string, string> = {
  asistido: "bg-success",
  recuperacion: "bg-info",
  tardanza_j: "bg-success-dark",
  tardanza_nj: "bg-warning",
  falta_j: "bg-primary",
  falta_nj: "bg-destructive",
  vacaciones: "bg-purple",
};

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

const generateDaysInMonth = (year: number, month: number) => {
  const totalDays = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: totalDays }, (_, i) => {
    const r = Math.random();
    const s = r > 0.90 ? "falta_nj" : r > 0.84 ? "falta_j" : r > 0.78 ? "tardanza_nj" : r > 0.74 ? "tardanza_j" : r > 0.70 ? "recuperacion" : r > 0.66 ? "vacaciones" : "asistido";
    return { day: i + 1, status: s };
  });
};

const getFirstDayOffset = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

const empleadosMock = [
  { id: "1", nombre: "Juan Pérez" },
  { id: "2", nombre: "María López" },
  { id: "3", nombre: "Carlos Mendoza" },
  { id: "4", nombre: "Ana Torres" },
];

const initialVacationRequests = [
  { empleado: "María López", fechas: "10/04 — 14/04/2026", dias: 5, estado: "Pendiente" },
  { empleado: "Carlos Mendoza", fechas: "21/04 — 25/04/2026", dias: 5, estado: "Aprobado" },
  { empleado: "Ana Torres", fechas: "05/05 — 09/05/2026", dias: 5, estado: "Rechazado" },
];

export default function AttendancePage() {
  const { toast } = useToast();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth()));
  const [selectedEmpleado, setSelectedEmpleado] = useState("all");
  const [daysInMonth, setDaysInMonth] = useState(() => generateDaysInMonth(now.getFullYear(), now.getMonth()));
  const [firstDayOffset, setFirstDayOffset] = useState(() => getFirstDayOffset(now.getFullYear(), now.getMonth()));

  const [showNuevaSolicitud, setShowNuevaSolicitud] = useState(false);
  const [solicitudes, setSolicitudes] = useState(initialVacationRequests);
  const [selEmpleado, setSelEmpleado] = useState("");
  const [fechaInicio, setFechaInicio] = useState<Date>();
  const [fechaFin, setFechaFin] = useState<Date>();
  const [motivo, setMotivo] = useState("");

  const diasCalculados = fechaInicio && fechaFin ? Math.max(differenceInCalendarDays(fechaFin, fechaInicio) + 1, 0) : 0;

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    const y = parseInt(year);
    const m = parseInt(selectedMonth);
    setDaysInMonth(generateDaysInMonth(y, m));
    setFirstDayOffset(getFirstDayOffset(y, m));
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    const y = parseInt(selectedYear);
    const m = parseInt(month);
    setDaysInMonth(generateDaysInMonth(y, m));
    setFirstDayOffset(getFirstDayOffset(y, m));
  };

  const handleVerRegistro = () => {
    if (selectedEmpleado === "all") {
      toast({ title: "Selecciona un empleado", description: "Debes seleccionar un empleado específico para ver su registro.", variant: "destructive" });
      return;
    }
    const empNombre = empleadosMock.find(e => e.id === selectedEmpleado)?.nombre || "";
    toast({ title: "Registro de asistencia", description: `Mostrando registro de ${empNombre} — ${meses[parseInt(selectedMonth)]} ${selectedYear}` });
  };

  const handleGuardar = () => {
    if (!selEmpleado || !fechaInicio || !fechaFin || diasCalculados <= 0) {
      toast({ title: "Error", description: "Completa todos los campos correctamente.", variant: "destructive" });
      return;
    }
    const empNombre = empleadosMock.find(e => e.id === selEmpleado)?.nombre || "";
    const fechasStr = `${format(fechaInicio, "dd/MM", { locale: es })} — ${format(fechaFin, "dd/MM/yyyy", { locale: es })}`;
    setSolicitudes(prev => [...prev, { empleado: empNombre, fechas: fechasStr, dias: diasCalculados, estado: "Pendiente" }]);
    toast({ title: "Solicitud enviada", description: `Vacaciones de ${empNombre} registradas como pendiente.` });
    setShowNuevaSolicitud(false);
    setSelEmpleado("");
    setFechaInicio(undefined);
    setFechaFin(undefined);
    setMotivo("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Control de Asistencia</h1>
          <p className="text-muted-foreground text-sm mt-1">Registro y gestión de asistencia del personal</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"><Download className="w-4 h-4" />Excel</Button>
          <Button variant="outline" size="sm" className="gap-1.5"><FileText className="w-4 h-4" />PDF</Button>
        </div>
      </div>

      <Tabs defaultValue="calendario">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="vacaciones">Vacaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="space-y-4 mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <CardTitle className="text-base">Asistencia Mensual</CardTitle>
                <div className="flex flex-wrap gap-2 items-center">
                  <Select value={selectedEmpleado} onValueChange={setSelectedEmpleado}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="Empleado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {empleadosMock.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {years.map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedMonth} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {meses.map((m, i) => (
                        <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={handleVerRegistro}>
                    <Eye className="w-4 h-4" />Ver Registro
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1.5 mb-4">
                {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d => (
                  <div key={d} className="text-xs font-semibold text-muted-foreground text-center py-1">{d}</div>
                ))}
                {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`b-${i}`} />)}
                {daysInMonth.map((d) => (
                  <div key={d.day} className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium cursor-pointer transition-transform hover:scale-105 ${statusColorMap[d.status]} text-primary-foreground`}>
                    {d.day}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success" />Asistido</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-info" />Recuperación</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success-dark" />Tard./Salida just.</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-warning" />Tardanza</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary" />Falta justificada</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive" />Falta</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple" />Vacaciones</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vacaciones" className="space-y-4 mt-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Solicitudes de Vacaciones</CardTitle>
              <Button size="sm" className="gap-1.5" onClick={() => setShowNuevaSolicitud(true)}><CalendarCheck className="w-4 h-4" />Nueva Solicitud</Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Empleado</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Fechas</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Días</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Estado</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Acciones</th>
                </tr></thead>
                <tbody>
                  {solicitudes.map((v, idx) => (
                    <tr key={idx} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-sm font-medium">{v.empleado}</td>
                      <td className="px-5 py-3 text-sm">{v.fechas}</td>
                      <td className="px-5 py-3 text-sm">{v.dias}</td>
                      <td className="px-5 py-3"><Badge variant={v.estado === "Aprobado" ? "default" : v.estado === "Rechazado" ? "destructive" : "secondary"} className="text-xs">{v.estado}</Badge></td>
                      <td className="px-5 py-3">
                        {v.estado === "Pendiente" && <div className="flex gap-1"><Button size="sm" variant="default" className="text-xs h-7">Aprobar</Button><Button size="sm" variant="outline" className="text-xs h-7">Rechazar</Button></div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Nueva Solicitud de Vacaciones */}
      <Dialog open={showNuevaSolicitud} onOpenChange={setShowNuevaSolicitud}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Vacaciones</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Empleado</Label>
              <Select value={selEmpleado} onValueChange={setSelEmpleado}>
                <SelectTrigger><SelectValue placeholder="Seleccionar empleado" /></SelectTrigger>
                <SelectContent>
                  {empleadosMock.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !fechaInicio && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaInicio ? format(fechaInicio, "dd/MM/yyyy") : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fechaInicio} onSelect={setFechaInicio} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Fecha de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !fechaFin && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaFin ? format(fechaFin, "dd/MM/yyyy") : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fechaFin} onSelect={setFechaFin} disabled={(date) => fechaInicio ? date < fechaInicio : false} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {diasCalculados > 0 && (
              <p className="text-sm text-muted-foreground">Días solicitados: <span className="font-semibold text-foreground">{diasCalculados}</span></p>
            )}
            <div className="space-y-2">
              <Label>Motivo / Observaciones</Label>
              <Textarea placeholder="Escribe el motivo de la solicitud..." value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNuevaSolicitud(false)}>Cancelar</Button>
            <Button onClick={handleGuardar}>Enviar Solicitud</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
