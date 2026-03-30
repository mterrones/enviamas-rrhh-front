import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShieldCheck, Plus, Pencil, Trash2, Users, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

// ── Permission modules structure ──
interface PermissionAction {
  key: string;
  label: string;
}

interface PermissionModule {
  module: string;
  label: string;
  actions: PermissionAction[];
}

const PERMISSION_MODULES: PermissionModule[] = [
  {
    module: "dashboard",
    label: "Dashboard",
    actions: [{ key: "dashboard.view", label: "Ver" }],
  },
  {
    module: "employees",
    label: "Empleados",
    actions: [
      { key: "employees.view", label: "Ver" },
      { key: "employees.create", label: "Crear" },
      { key: "employees.edit", label: "Editar" },
      { key: "employees.delete", label: "Eliminar" },
      { key: "employees.offboard", label: "Desvincular" },
    ],
  },
  {
    module: "attendance",
    label: "Asistencia",
    actions: [
      { key: "attendance.view", label: "Ver" },
      { key: "attendance.manage", label: "Gestionar" },
      { key: "attendance.approve", label: "Aprobar" },
    ],
  },
  {
    module: "payroll",
    label: "Boletas y Nómina",
    actions: [
      { key: "payroll.view", label: "Ver" },
      { key: "payroll.generate", label: "Generar" },
      { key: "payroll.send", label: "Enviar" },
    ],
  },
  {
    module: "portal",
    label: "Portal del Empleado",
    actions: [{ key: "portal.view", label: "Ver" }],
  },
  {
    module: "assets",
    label: "Activos y Equipos",
    actions: [
      { key: "assets.view", label: "Ver" },
      { key: "assets.manage", label: "Gestionar" },
    ],
  },
  {
    module: "reports",
    label: "Reportes",
    actions: [
      { key: "reports.view", label: "Ver" },
      { key: "reports.export", label: "Exportar" },
    ],
  },
  {
    module: "settings",
    label: "Configuración",
    actions: [
      { key: "settings.view", label: "Ver" },
      { key: "settings.users", label: "Usuarios" },
      { key: "settings.smtp", label: "SMTP" },
      { key: "settings.params", label: "Parámetros" },
      { key: "settings.audit", label: "Auditoría" },
      { key: "settings.backup", label: "Backup" },
      { key: "settings.profiles", label: "Perfiles" },
    ],
  },
];

const ALL_PERMISSIONS = PERMISSION_MODULES.flatMap((m) => m.actions.map((a) => a.key));

// ── Mock profiles ──
interface Profile {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
  isSystem?: boolean;
}

interface MockUser {
  id: string;
  name: string;
  email: string;
  profileId: string;
}

const INITIAL_PROFILES: Profile[] = [
  {
    id: "superadmin_rrhh",
    name: "Superadmin RRHH",
    description: "Acceso total al sistema, incluyendo configuración avanzada, auditoría y backups.",
    color: "hsl(var(--primary))",
    permissions: ALL_PERMISSIONS,
    isSystem: true,
  },
  {
    id: "admin_rrhh",
    name: "Admin RRHH",
    description: "Gestión operativa de RRHH: empleados, asistencia, nómina, activos y reportes.",
    color: "hsl(30 80% 55%)",
    permissions: [
      "dashboard.view",
      "employees.view", "employees.create", "employees.edit",
      "attendance.view", "attendance.manage",
      "payroll.view", "payroll.generate", "payroll.send",
      "portal.view",
      "assets.view", "assets.manage",
      "reports.view", "reports.export",
    ],
  },
  {
    id: "jefe_area",
    name: "Jefe de Área",
    description: "Visualización de datos de su equipo y aprobación de solicitudes.",
    color: "hsl(210 60% 50%)",
    permissions: [
      "dashboard.view",
      "employees.view",
      "attendance.view", "attendance.approve",
      "payroll.view",
      "portal.view",
      "assets.view",
      "reports.view",
    ],
  },
  {
    id: "empleado",
    name: "Empleado",
    description: "Acceso limitado al portal personal del empleado.",
    color: "hsl(150 50% 45%)",
    permissions: ["portal.view"],
  },
];

const MOCK_USERS: MockUser[] = [
  { id: "1", name: "Ana Castillo", email: "ana@enviam.as", profileId: "superadmin_rrhh" },
  { id: "2", name: "Lucía Fernández", email: "lucia@enviam.as", profileId: "admin_rrhh" },
  { id: "5", name: "Sofía Ramírez", email: "sofia@enviam.as", profileId: "admin_rrhh" },
  { id: "3", name: "Carlos Mendoza", email: "carlos@enviam.as", profileId: "jefe_area" },
  { id: "6", name: "Roberto Díaz", email: "roberto@enviam.as", profileId: "jefe_area" },
  { id: "4", name: "Juan Pérez", email: "juan@enviam.as", profileId: "empleado" },
  { id: "7", name: "María López", email: "maria@enviam.as", profileId: "empleado" },
  { id: "8", name: "Pedro García", email: "pedro@enviam.as", profileId: "empleado" },
  { id: "9", name: "Laura Torres", email: "laura@enviam.as", profileId: "empleado" },
];

// ── Component ──
export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

  const usersForProfile = (profileId: string) =>
    MOCK_USERS.filter((u) => u.profileId === profileId);

  const activePermCount = (perms: string[]) => perms.length;

  // ── Handlers ──
  const handleCreate = () => {
    const newProfile: Profile = {
      id: `custom_${Date.now()}`,
      name: "Nuevo Perfil",
      description: "",
      color: "hsl(270 50% 55%)",
      permissions: [],
    };
    setEditingProfile(newProfile);
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!editingProfile) return;
    if (!editingProfile.name.trim()) {
      toast.error("El nombre del perfil es obligatorio");
      return;
    }
    setProfiles((prev) => {
      const exists = prev.find((p) => p.id === editingProfile.id);
      if (exists) return prev.map((p) => (p.id === editingProfile.id ? editingProfile : p));
      return [...prev, editingProfile];
    });
    toast.success(isCreating ? "Perfil creado exitosamente" : "Perfil actualizado exitosamente");
    setEditingProfile(null);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    toast.success("Perfil eliminado");
    setDeleteDialogId(null);
  };

  const togglePermission = (key: string) => {
    if (!editingProfile) return;
    setEditingProfile((prev) => {
      if (!prev) return prev;
      const has = prev.permissions.includes(key);
      return {
        ...prev,
        permissions: has ? prev.permissions.filter((p) => p !== key) : [...prev.permissions, key],
      };
    });
  };

  const toggleModule = (mod: PermissionModule, allActive: boolean) => {
    if (!editingProfile) return;
    setEditingProfile((prev) => {
      if (!prev) return prev;
      const moduleKeys = mod.actions.map((a) => a.key);
      if (allActive) {
        return { ...prev, permissions: prev.permissions.filter((p) => !moduleKeys.includes(p)) };
      }
      const newPerms = new Set([...prev.permissions, ...moduleKeys]);
      return { ...prev, permissions: Array.from(newPerms) };
    });
  };

  // ── EDIT VIEW ──
  if (editingProfile) {
    const users = usersForProfile(editingProfile.id);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setEditingProfile(null); setIsCreating(false); }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {isCreating ? "Nuevo Perfil" : "Editar Perfil"}
          </h1>
        </div>

        {/* Profile info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información del Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nombre</label>
                <Input
                  value={editingProfile.name}
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  disabled={editingProfile.isSystem}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Usuarios asignados</label>
                <div className="flex items-center gap-2 h-10">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{users.length} usuario(s)</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Descripción</label>
              <Textarea
                value={editingProfile.description}
                onChange={(e) => setEditingProfile({ ...editingProfile, description: e.target.value })}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Permissions matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Matriz de Permisos
              <Badge variant="secondary" className="ml-2">
                {activePermCount(editingProfile.permissions)} / {ALL_PERMISSIONS.length} activos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {PERMISSION_MODULES.map((mod) => {
              const moduleActive = mod.actions.filter((a) => editingProfile.permissions.includes(a.key));
              const allActive = moduleActive.length === mod.actions.length;
              return (
                <div key={mod.module} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-sm text-foreground">{mod.label}</h3>
                      <Badge
                        variant={moduleActive.length > 0 ? "default" : "outline"}
                        className="text-xs"
                      >
                        {moduleActive.length}/{mod.actions.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Todos</span>
                      <Switch
                        checked={allActive}
                        onCheckedChange={() => toggleModule(mod, allActive)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {mod.actions.map((action) => {
                      const active = editingProfile.permissions.includes(action.key);
                      return (
                        <div
                          key={action.key}
                          className="flex items-center gap-2 p-2 rounded-md border border-border bg-card"
                        >
                          <Switch
                            checked={active}
                            onCheckedChange={() => togglePermission(action.key)}
                            className="scale-90"
                          />
                          <span className="text-xs font-medium text-foreground">{action.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Assigned users */}
        {users.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Usuarios Asignados ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {u.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => { setEditingProfile(null); setIsCreating(false); }}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Check className="w-4 h-4 mr-2" />
            {isCreating ? "Crear Perfil" : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Perfiles y Permisos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona los roles del sistema y sus permisos por módulo
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Perfil
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Perfil</TableHead>
                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                <TableHead className="text-center">Usuarios</TableHead>
                <TableHead className="text-center">Permisos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => {
                const users = usersForProfile(profile.id);
                return (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: profile.color }}
                        />
                        <div>
                          <p className="font-medium text-foreground text-sm">{profile.name}</p>
                          {profile.isSystem && (
                            <Badge variant="outline" className="text-[10px] mt-0.5">Sistema</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                        {profile.description}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{users.length}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {activePermCount(profile.permissions)}/{ALL_PERMISSIONS.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingProfile({ ...profile })}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {!profile.isSystem && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteDialogId(profile.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <Dialog open={!!deleteDialogId} onOpenChange={() => setDeleteDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar este perfil?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acción no se puede deshacer. Los usuarios asignados a este perfil perderán sus permisos.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteDialogId && handleDelete(deleteDialogId)}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
