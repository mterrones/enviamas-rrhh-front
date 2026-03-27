import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Calendar, Bell, User, Download } from "lucide-react";

const myBoletas = [
  { periodo: "Marzo 2026", monto: "S/ 2,175.00", estado: "Nueva" },
  { periodo: "Febrero 2026", monto: "S/ 2,175.00", estado: "Confirmada" },
  { periodo: "Enero 2026", monto: "S/ 2,175.00", estado: "Confirmada" },
];

const myRequests = [
  { tipo: "Vacaciones", fechas: "10/04 — 14/04/2026", estado: "Pendiente" },
  { tipo: "Permiso", fechas: "20/03/2026", estado: "Aprobado" },
];

const myNotifications = [
  { titulo: "Boleta disponible", desc: "Tu boleta de marzo 2026 está lista", fecha: "Hoy" },
  { titulo: "Solicitud aprobada", desc: "Tu permiso del 20/03 fue aprobado", fecha: "Ayer" },
];

export default function EmployeePortalPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Portal del Empleado</h1>
        <p className="text-muted-foreground text-sm mt-1">Bienvenido, Juan Pérez</p>
      </div>

      <Tabs defaultValue="boletas">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="boletas" className="gap-1.5"><FileText className="w-4 h-4" />Mis Boletas</TabsTrigger>
          <TabsTrigger value="asistencia" className="gap-1.5"><Calendar className="w-4 h-4" />Mis Asistencias</TabsTrigger>
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
              <Button size="sm" className="gap-1.5">Nueva Solicitud</Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Tipo</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Fechas</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Estado</th>
                </tr></thead>
                <tbody>
                  {myRequests.map((r) => (
                    <tr key={r.tipo + r.fechas} className="border-b border-border last:border-0">
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
    </div>
  );
}
