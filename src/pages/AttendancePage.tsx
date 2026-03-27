import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, FileText, Download } from "lucide-react";

const statusColorMap: Record<string, string> = {
  asistido: "bg-success", falta_j: "bg-warning", falta_nj: "bg-destructive",
  tardanza_j: "bg-secondary", tardanza_nj: "bg-warning", vacaciones: "bg-info",
  recuperacion: "bg-primary/60",
};

const daysInMonth = Array.from({ length: 31 }, (_, i) => {
  const r = Math.random();
  const s = r > 0.88 ? "falta_nj" : r > 0.82 ? "falta_j" : r > 0.76 ? "tardanza_nj" : r > 0.72 ? "vacaciones" : "asistido";
  return { day: i + 1, status: s };
});

const vacationRequests = [
  { empleado: "María López", fechas: "10/04 — 14/04/2026", dias: 5, estado: "Pendiente" },
  { empleado: "Carlos Mendoza", fechas: "21/04 — 25/04/2026", dias: 5, estado: "Aprobado" },
  { empleado: "Ana Torres", fechas: "05/05 — 09/05/2026", dias: 5, estado: "Rechazado" },
];

export default function AttendancePage() {
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
                <div className="flex gap-2">
                  <Select defaultValue="all"><SelectTrigger className="w-44"><SelectValue placeholder="Empleado" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="1">Juan Pérez</SelectItem><SelectItem value="2">María López</SelectItem></SelectContent>
                  </Select>
                  <Select defaultValue="03"><SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="01">Enero</SelectItem><SelectItem value="02">Febrero</SelectItem><SelectItem value="03">Marzo</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1.5 mb-4">
                {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d => (
                  <div key={d} className="text-xs font-semibold text-muted-foreground text-center py-1">{d}</div>
                ))}
                {Array.from({ length: 6 }).map((_, i) => <div key={`b-${i}`} />)}
                {daysInMonth.map((d) => (
                  <div key={d.day} className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium cursor-pointer transition-transform hover:scale-105 ${statusColorMap[d.status]} text-primary-foreground`}>
                    {d.day}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success" />Asistido</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive" />Falta No Just.</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-warning" />Falta Just. / Tardanza</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-info" />Vacaciones</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vacaciones" className="space-y-4 mt-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Solicitudes de Vacaciones</CardTitle>
              <Button size="sm" className="gap-1.5"><CalendarCheck className="w-4 h-4" />Nueva Solicitud</Button>
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
                  {vacationRequests.map((v) => (
                    <tr key={v.empleado} className="border-b border-border last:border-0">
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
    </div>
  );
}
