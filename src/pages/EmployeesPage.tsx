import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  activo: { label: "Activo", variant: "default" },
  suspendido: { label: "Suspendido", variant: "secondary" },
  cesado: { label: "Cesado", variant: "destructive" },
  vacaciones: { label: "Vacaciones", variant: "outline" },
};

const employees = [
  { id: "1", nombre: "Juan Pérez", dni: "72345678", area: "Contact Center", puesto: "Operador", estado: "activo", jefe: "Ana Castillo", initials: "JP" },
  { id: "2", nombre: "María López", dni: "71234567", area: "Chat Bot", puesto: "Desarrolladora", estado: "vacaciones", jefe: "Carlos Mendoza", initials: "ML" },
  { id: "3", nombre: "Carlos Mendoza", dni: "70123456", area: "Campañas", puesto: "Jefe de Área", estado: "activo", jefe: "Ana Castillo", initials: "CM" },
  { id: "4", nombre: "Ana Torres", dni: "73456789", area: "TI", puesto: "Soporte TI", estado: "activo", jefe: "Carlos Mendoza", initials: "AT" },
  { id: "5", nombre: "Pedro Ruiz", dni: "74567890", area: "Contact Center", puesto: "Supervisor", estado: "suspendido", jefe: "Ana Castillo", initials: "PR" },
  { id: "6", nombre: "Lucía Fernández", dni: "75678901", area: "Admin", puesto: "Asistente RRHH", estado: "activo", jefe: "Ana Castillo", initials: "LF" },
  { id: "7", nombre: "Roberto Sánchez", dni: "76789012", area: "Contact Center", puesto: "Operador", estado: "cesado", jefe: "Pedro Ruiz", initials: "RS" },
  { id: "8", nombre: "Diana Vargas", dni: "77890123", area: "Chat Bot", puesto: "QA Tester", estado: "activo", jefe: "Carlos Mendoza", initials: "DV" },
];

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filtered = employees.filter((e) => {
    const matchSearch = e.nombre.toLowerCase().includes(search.toLowerCase()) || e.dni.includes(search);
    const matchStatus = statusFilter === "todos" || e.estado === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Empleados</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión del personal de EnviaMas</p>
        </div>
        <Link to="/empleados/nuevo">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Nuevo Empleado
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o DNI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
                <SelectItem value="cesado">Cesado</SelectItem>
                <SelectItem value="vacaciones">Vacaciones</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Empleado</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">DNI</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Área</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Puesto</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Estado</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Jefe Directo</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const st = statusConfig[emp.estado];
                return (
                  <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{emp.initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{emp.nombre}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{emp.dni}</td>
                    <td className="px-5 py-3 text-sm">{emp.area}</td>
                    <td className="px-5 py-3 text-sm">{emp.puesto}</td>
                    <td className="px-5 py-3">
                      <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{emp.jefe}</td>
                    <td className="px-5 py-3">
                      <Link to={`/empleados/${emp.id}`}>
                        <Button variant="ghost" size="sm" className="text-primary text-xs">Ver perfil</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
