import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Asset {
  id: number;
  tipo: string;
  descripcion: string;
  empleado: string;
  fecha: string;
  estado: string;
}

const initialAssets: Asset[] = [
  { id: 1, tipo: "Laptop", descripcion: "Lenovo ThinkPad T14", empleado: "Juan Pérez", fecha: "01/01/2026", estado: "En uso" },
  { id: 2, tipo: "Headset", descripcion: "Jabra Evolve2 40", empleado: "Juan Pérez", fecha: "01/01/2026", estado: "En uso" },
  { id: 3, tipo: "Monitor", descripcion: "Dell 24\" FHD", empleado: "María López", fecha: "15/01/2026", estado: "Asignado" },
  { id: 4, tipo: "Laptop", descripcion: "HP EliteBook 840", empleado: "—", fecha: "10/12/2025", estado: "En mantenimiento" },
  { id: 5, tipo: "Teclado", descripcion: "Logitech K380", empleado: "Carlos Mendoza", fecha: "01/02/2026", estado: "En uso" },
  { id: 6, tipo: "Laptop", descripcion: "Dell Latitude 5520", empleado: "Roberto Sánchez", fecha: "01/03/2025", estado: "Devuelto" },
];

const empleadosMock = ["Juan Pérez", "María López", "Carlos Mendoza", "Roberto Sánchez", "Ana García", "Luis Torres"];

const estadoVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "En uso": "default", "Asignado": "default", "En mantenimiento": "secondary", "Devuelto": "outline", "Disponible": "secondary",
};

export default function AssetsPage() {
  const [search, setSearch] = useState("");
  const [activos, setActivos] = useState<Asset[]>(initialAssets);
  const [showRegistrar, setShowRegistrar] = useState(false);
  const { toast } = useToast();

  // Form states
  const [tipo, setTipo] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [empleado, setEmpleado] = useState("");
  const [estado, setEstado] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const resetForm = () => {
    setTipo(""); setMarca(""); setModelo(""); setSerie("");
    setEmpleado(""); setEstado(""); setObservaciones("");
  };

  const handleGuardar = () => {
    if (!tipo || !modelo) {
      toast({ title: "Campos requeridos", description: "Tipo y Modelo/Descripción son obligatorios.", variant: "destructive" });
      return;
    }
    const descripcion = marca ? `${marca} ${modelo}` : modelo;
    const nuevoActivo: Asset = {
      id: Date.now(),
      tipo,
      descripcion,
      empleado: empleado || "—",
      fecha: format(new Date(), "dd/MM/yyyy"),
      estado: estado || "Disponible",
    };
    setActivos((prev) => [nuevoActivo, ...prev]);
    setShowRegistrar(false);
    resetForm();
    toast({ title: "Activo registrado", description: `${descripcion} se registró correctamente.` });
  };

  const filtered = activos.filter(a =>
    a.descripcion.toLowerCase().includes(search.toLowerCase()) ||
    a.empleado.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Activos y Equipos</h1>
          <p className="text-muted-foreground text-sm mt-1">Control de equipos asignados al personal</p>
        </div>
        <Button className="gap-2" onClick={() => setShowRegistrar(true)}><Plus className="w-4 h-4" />Registrar Activo</Button>
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

      {/* Modal Registrar Activo */}
      <Dialog open={showRegistrar} onOpenChange={setShowRegistrar}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Activo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de activo *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {["Laptop", "Monitor", "Headset", "Teclado", "Mouse", "Otro"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input placeholder="Ej: Lenovo, Dell..." value={marca} onChange={e => setMarca(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Modelo / Descripción *</Label>
                <Input placeholder="Ej: ThinkPad T14" value={modelo} onChange={e => setModelo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Número de serie</Label>
                <Input placeholder="Ej: SN-123456" value={serie} onChange={e => setSerie(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Empleado asignado</Label>
                <Select value={empleado} onValueChange={setEmpleado}>
                  <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {empleadosMock.map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger><SelectValue placeholder="Disponible" /></SelectTrigger>
                  <SelectContent>
                    {["Disponible", "En uso", "Asignado", "En mantenimiento"].map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea placeholder="Notas adicionales sobre el activo..." value={observaciones} onChange={e => setObservaciones(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRegistrar(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleGuardar}>Registrar Activo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
