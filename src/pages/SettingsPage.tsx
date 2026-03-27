import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Users, Mail, Shield, FileText, Database } from "lucide-react";

const users = [
  { nombre: "Ana Castillo", email: "ana@enviam.as", rol: "Superadmin RRHH", estado: "Activo" },
  { nombre: "Carlos Mendoza", email: "carlos@enviam.as", rol: "Jefe de Área", estado: "Activo" },
  { nombre: "Lucía Fernández", email: "lucia@enviam.as", rol: "Admin RRHH", estado: "Activo" },
  { nombre: "Juan Pérez", email: "juan@enviam.as", rol: "Empleado", estado: "Activo" },
];

const auditLogs = [
  { fecha: "27/03/2026 10:30", usuario: "Ana Castillo", modulo: "Empleados", accion: "Actualización de sueldo", detalle: "Juan Pérez: S/2,300 → S/2,500" },
  { fecha: "26/03/2026 15:20", usuario: "Carlos Mendoza", modulo: "Asistencia", accion: "Aprobación de vacaciones", detalle: "María López: 5 días aprobados" },
  { fecha: "25/03/2026 09:15", usuario: "Ana Castillo", modulo: "Empleados", accion: "Nuevo registro", detalle: "Roberto Sánchez — Contact Center" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Administración del sistema — Solo Superadmin RRHH</p>
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="usuarios" className="gap-1.5"><Users className="w-4 h-4" />Usuarios</TabsTrigger>
          <TabsTrigger value="smtp" className="gap-1.5"><Mail className="w-4 h-4" />SMTP</TabsTrigger>
          <TabsTrigger value="parametros" className="gap-1.5"><Shield className="w-4 h-4" />Parámetros</TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-1.5"><FileText className="w-4 h-4" />Auditoría</TabsTrigger>
          <TabsTrigger value="backup" className="gap-1.5"><Database className="w-4 h-4" />Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Gestión de Usuarios</CardTitle>
              <Button size="sm">Nuevo Usuario</Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-muted/50">
                  {["Nombre", "Email", "Rol", "Estado", "Acciones"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.email} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-sm font-medium">{u.nombre}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{u.email}</td>
                      <td className="px-5 py-3"><Badge variant="secondary" className="text-xs">{u.rol}</Badge></td>
                      <td className="px-5 py-3"><Badge variant="default" className="text-xs">{u.estado}</Badge></td>
                      <td className="px-5 py-3"><Button variant="ghost" size="sm" className="text-xs text-primary">Editar</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smtp" className="mt-4">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Configuración SMTP</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              {[["Host SMTP", "smtp.enviam.as"], ["Puerto", "587"], ["Usuario", "noreply@enviam.as"], ["Contraseña", ""]].map(([l, v]) => (
                <div key={l} className="space-y-1.5">
                  <Label className="text-sm">{l}</Label>
                  <Input defaultValue={v} type={l === "Contraseña" ? "password" : "text"} />
                </div>
              ))}
              <Button size="sm">Guardar Configuración</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parametros" className="mt-4">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Parámetros Legales</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              {[["RMV (Remuneración Mínima Vital)", "S/ 1,025.00"], ["UIT (Unidad Impositiva Tributaria)", "S/ 5,150.00"], ["Tasa AFP Integra", "10.00%"], ["Tasa AFP Prima", "10.00%"], ["Tasa ONP", "13.00%"]].map(([l, v]) => (
                <div key={l} className="space-y-1.5">
                  <Label className="text-sm">{l}</Label>
                  <Input defaultValue={v} />
                </div>
              ))}
              <Button size="sm">Guardar Parámetros</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria" className="mt-4">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Registro de Auditoría</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-muted/50">
                  {["Fecha", "Usuario", "Módulo", "Acción", "Detalle"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {auditLogs.map((l, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">{l.fecha}</td>
                      <td className="px-5 py-3 text-sm">{l.usuario}</td>
                      <td className="px-5 py-3 text-sm">{l.modulo}</td>
                      <td className="px-5 py-3 text-sm font-medium">{l.accion}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{l.detalle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="mt-4">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Backup y Restauración</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Genera un respaldo completo de la base de datos del sistema.</p>
              <div className="flex gap-3">
                <Button size="sm" className="gap-1.5"><Database className="w-4 h-4" />Generar Backup</Button>
                <Button size="sm" variant="outline">Restaurar desde Backup</Button>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Últimos backups</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>📦 backup_2026-03-27_10-00.sql — 12.4 MB</p>
                  <p>📦 backup_2026-03-20_10-00.sql — 11.8 MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
