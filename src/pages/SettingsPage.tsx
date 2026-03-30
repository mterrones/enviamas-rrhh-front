import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Mail, Shield, FileText, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Usuario {
  nombre: string;
  email: string;
  rol: string;
  estado: string;
}

const initialUsers: Usuario[] = [
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

const areas = ["Contact Center", "Ventas", "Soporte", "Administración", "Logística", "Marketing"];

export default function SettingsPage() {
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsers);
  const [showNuevoUsuario, setShowNuevoUsuario] = useState(false);

  // Form fields
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("");
  const [area, setArea] = useState("");
  const [password, setPassword] = useState("");

  const resetForm = () => {
    setNombre("");
    setEmail("");
    setRol("");
    setArea("");
    setPassword("");
  };

  const handleGuardar = () => {
    if (!nombre.trim() || !email.trim() || !rol || !password.trim()) {
      toast({ title: "Campos obligatorios", description: "Completa nombre, email, rol y contraseña.", variant: "destructive" });
      return;
    }
    if (rol === "Jefe de Área" && !area) {
      toast({ title: "Campo obligatorio", description: "Selecciona el área para el Jefe de Área.", variant: "destructive" });
      return;
    }

    const rolLabel = rol === "Jefe de Área" ? `Jefe de Área${area ? ` — ${area}` : ""}` : rol;

    setUsuarios(prev => [...prev, { nombre: nombre.trim(), email: email.trim(), rol: rolLabel, estado: "Activo" }]);
    setShowNuevoUsuario(false);
    resetForm();
    toast({ title: "Usuario registrado", description: `${nombre.trim()} fue agregado como ${rolLabel}.` });
  };

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
              <Button size="sm" onClick={() => setShowNuevoUsuario(true)}>Nuevo Usuario</Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-muted/50">
                  {["Nombre", "Email", "Rol", "Estado", "Acciones"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {usuarios.map(u => (
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

      {/* Dialog Nuevo Usuario */}
      <Dialog open={showNuevoUsuario} onOpenChange={(open) => { if (!open) { resetForm(); } setShowNuevoUsuario(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Nombre completo *</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: María García" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Email *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@enviam.as" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Rol *</Label>
              <Select value={rol} onValueChange={v => { setRol(v); if (v !== "Jefe de Área") setArea(""); }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin RRHH">Admin RRHH</SelectItem>
                  <SelectItem value="Jefe de Área">Jefe de Área</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {rol === "Jefe de Área" && (
              <div className="space-y-1.5">
                <Label className="text-sm">Área *</Label>
                <Select value={area} onValueChange={setArea}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar área" /></SelectTrigger>
                  <SelectContent>
                    {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm">Contraseña temporal *</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowNuevoUsuario(false); }}>Cancelar</Button>
            <Button onClick={handleGuardar}>Registrar Usuario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
