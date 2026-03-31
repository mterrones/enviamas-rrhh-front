import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const employeeData = {
  nombre: "Juan Pérez", dni: "72345678", fechaNac: "15/03/1995", estudios: "Universitario", carrera: "Ing. Sistemas",
  telefono: "987654321", correo: "juan.perez@enviam.as", direccion: "Av. Arequipa 1234, Lima",
  emergenciaNombre: "Rosa Pérez", emergenciaTelefono: "912345678",
  banco: "BCP", cuenta: "191-123456-0-12", prevision: "AFP Integra",
  estado: "activo", puesto: "Operador", area: "Contact Center", modalidad: "Full-time",
  horario: "09:00 - 18:00", sueldo: "S/ 2,500.00", contrato: "Plazo Fijo",
  inicioContrato: "01/01/2026", finContrato: "30/06/2026", jefe: "Ana Castillo",
};

const attendanceDays = Array.from({ length: 31 }, (_, i) => {
  const r = Math.random();
  return { day: i + 1, status: r > 0.85 ? "falta" : r > 0.75 ? "tardanza" : r > 0.7 ? "vacaciones" : "asistido" };
});

const boletas = [
  { periodo: "Marzo 2026", estado: "Pendiente", monto: "S/ 2,280.00" },
  { periodo: "Febrero 2026", estado: "Confirmado", monto: "S/ 2,280.00" },
  { periodo: "Enero 2026", estado: "Confirmado", monto: "S/ 2,280.00" },
];

const activos = [
  { tipo: "Laptop", descripcion: "Lenovo ThinkPad T14", fecha: "01/01/2026", estado: "En uso" },
  { tipo: "Headset", descripcion: "Jabra Evolve2 40", fecha: "01/01/2026", estado: "En uso" },
];

const statusColorMap: Record<string, string> = {
  asistido: "bg-success", falta: "bg-destructive", tardanza: "bg-warning", vacaciones: "bg-info",
};

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const e = employeeData;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/empleados" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a empleados
      </Link>

      {/* Header */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">JP</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl font-bold">{e.nombre}</h1>
                <Badge variant="default" className="w-fit">Activo</Badge>
              </div>
              <p className="text-muted-foreground mt-1">{e.puesto} — {e.area}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{e.correo}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{e.telefono}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{e.direccion}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="personal">Datos Personales</TabsTrigger>
          <TabsTrigger value="laboral">Datos Laborales</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="boletas">Boletas</TabsTrigger>
          <TabsTrigger value="activos">Activos</TabsTrigger>
          <TabsTrigger value="desvinculacion">Desvinculación</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base">Información Personal</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[["DNI", e.dni], ["Fecha de Nacimiento", e.fechaNac], ["Nivel de Estudios", e.estudios], ["Carrera", e.carrera]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{l}</span><span className="font-medium">{v}</span>
                  </div>
                ))}
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Documentos</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Upload className="w-3.5 h-3.5" />Antecedentes (PDF)</Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Upload className="w-3.5 h-3.5" />CV (PDF)</Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Upload className="w-3.5 h-3.5" />Examen Médico (PDF)</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base">Contacto y Datos Bancarios</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[["Teléfono", e.telefono], ["Correo", e.correo], ["Dirección", e.direccion]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm"><span className="text-muted-foreground">{l}</span><span className="font-medium">{v}</span></div>
                ))}
                <Separator />
                <p className="text-sm font-medium">Contacto de Emergencia</p>
                {[["Nombre", e.emergenciaNombre], ["Teléfono", e.emergenciaTelefono]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm"><span className="text-muted-foreground">{l}</span><span className="font-medium">{v}</span></div>
                ))}
                <Separator />
                <p className="text-sm font-medium">Datos Bancarios</p>
                {[["Banco", e.banco], ["Cuenta", e.cuenta], ["Sistema Previsional", e.prevision]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm"><span className="text-muted-foreground">{l}</span><span className="font-medium">{v}</span></div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="laboral">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Información Laboral</CardTitle>
              <Button size="sm" className="gap-1.5">Actualizar Sueldo</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                {[["Puesto", e.puesto], ["Área", e.area], ["Modalidad", e.modalidad], ["Horario", e.horario],
                  ["Sueldo Actual", e.sueldo], ["Tipo de Contrato", e.contrato],
                  ["Inicio Contrato", e.inicioContrato], ["Fin Contrato", e.finContrato],
                  ["Jefe Directo", e.jefe]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground">{l}</span><span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-warning" />
                <span className="text-sm text-warning font-medium">Contrato vence en 95 días</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asistencia">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Asistencia — Marzo 2026</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1.5 mb-4">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
                  <div key={d} className="text-xs font-semibold text-muted-foreground text-center py-1">{d}</div>
                ))}
                {/* offset for March 2026 starts Sunday */}
                {Array.from({ length: 6 }).map((_, i) => <div key={`blank-${i}`} />)}
                {attendanceDays.map((d) => (
                  <div key={d.day} className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium cursor-pointer transition-colors ${statusColorMap[d.status]} text-primary-foreground`}>
                    {d.day}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success" />Asistido</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive" />Falta</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-warning" />Tardanza</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-info" />Vacaciones</span>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[["Días Asistidos", "22"], ["Faltas", "3"], ["Tardanzas", "4"], ["Horas Extra", "8h"]].map(([l, v]) => (
                  <div key={l} className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{v}</p>
                    <p className="text-xs text-muted-foreground mt-1">{l}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boletas">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Boletas de Pago</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Periodo</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Neto</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Estado</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Acciones</th>
                </tr></thead>
                <tbody>
                  {boletas.map((b) => (
                    <tr key={b.periodo} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-sm font-medium">{b.periodo}</td>
                      <td className="px-5 py-3 text-sm">{b.monto}</td>
                      <td className="px-5 py-3"><Badge variant={b.estado === "Confirmado" ? "default" : "secondary"} className="text-xs">{b.estado}</Badge></td>
                      <td className="px-5 py-3"><Button variant="ghost" size="sm" className="text-xs text-primary">Descargar PDF</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activos">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Activos Asignados</CardTitle>
              <Button size="sm" variant="outline" className="gap-1.5"><Briefcase className="w-3.5 h-3.5" />Asignar Equipo</Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Tipo</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Descripción</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Fecha Asignación</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Estado</th>
                </tr></thead>
                <tbody>
                  {activos.map((a) => (
                    <tr key={a.descripcion} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-sm font-medium">{a.tipo}</td>
                      <td className="px-5 py-3 text-sm">{a.descripcion}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{a.fecha}</td>
                      <td className="px-5 py-3"><Badge variant="default" className="text-xs">{a.estado}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="desvinculacion">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Proceso de Desvinculación</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                Este módulo estará disponible cuando se inicie el proceso de cese del empleado. Incluirá cálculo de liquidación (CTS, vacaciones truncas, gratificación trunca), checklist de offboarding y generación de carta de cese.
              </div>
              <Button variant="destructive" size="sm">Iniciar Proceso de Cese</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
