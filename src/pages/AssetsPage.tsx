import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Plus, Upload } from "lucide-react";
import { useState } from "react";

const assets = [
  { id: 1, tipo: "Laptop", descripcion: "Lenovo ThinkPad T14", empleado: "Juan Pérez", fecha: "01/01/2026", estado: "En uso" },
  { id: 2, tipo: "Headset", descripcion: "Jabra Evolve2 40", empleado: "Juan Pérez", fecha: "01/01/2026", estado: "En uso" },
  { id: 3, tipo: "Monitor", descripcion: "Dell 24\" FHD", empleado: "María López", fecha: "15/01/2026", estado: "Asignado" },
  { id: 4, tipo: "Laptop", descripcion: "HP EliteBook 840", empleado: "—", fecha: "10/12/2025", estado: "En mantenimiento" },
  { id: 5, tipo: "Teclado", descripcion: "Logitech K380", empleado: "Carlos Mendoza", fecha: "01/02/2026", estado: "En uso" },
  { id: 6, tipo: "Laptop", descripcion: "Dell Latitude 5520", empleado: "Roberto Sánchez", fecha: "01/03/2025", estado: "Devuelto" },
];

const estadoVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "En uso": "default", "Asignado": "default", "En mantenimiento": "secondary", "Devuelto": "outline",
};

export default function AssetsPage() {
  const [search, setSearch] = useState("");

  const filtered = assets.filter(a => a.descripcion.toLowerCase().includes(search.toLowerCase()) || a.empleado.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Activos y Equipos</h1>
          <p className="text-muted-foreground text-sm mt-1">Control de equipos asignados al personal</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" />Registrar Activo</Button>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar equipo o empleado..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select defaultValue="todos"><SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todos los estados</SelectItem><SelectItem value="uso">En uso</SelectItem><SelectItem value="mant">En mantenimiento</SelectItem><SelectItem value="dev">Devuelto</SelectItem></SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-border bg-muted/50">
              {["Tipo", "Descripción", "Empleado", "Fecha Asignación", "Estado", "Acciones"].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3 text-sm font-medium">{a.tipo}</td>
                  <td className="px-5 py-3 text-sm">{a.descripcion}</td>
                  <td className="px-5 py-3 text-sm">{a.empleado}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{a.fecha}</td>
                  <td className="px-5 py-3"><Badge variant={estadoVariant[a.estado] || "secondary"} className="text-xs">{a.estado}</Badge></td>
                  <td className="px-5 py-3"><Button variant="ghost" size="sm" className="text-xs text-primary gap-1"><Upload className="w-3.5 h-3.5" />Acta PDF</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
