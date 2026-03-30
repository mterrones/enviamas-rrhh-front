import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const areas = ["Contact Center", "Chat Bot", "Campañas", "TI", "Admin"];
const puestos = ["Operador", "Supervisor", "Jefe de Área", "Desarrolladora", "Soporte TI", "Asistente RRHH", "QA Tester"];
const bancos = ["BCP", "BBVA", "Interbank", "Scotiabank", "BanBif", "Caja Arequipa"];
const previsiones = ["AFP Integra", "AFP Prima", "AFP Profuturo", "AFP Habitat", "ONP"];
const contratos = ["Plazo Fijo", "Indefinido", "Locación de Servicios"];
const modalidades = ["Full-time", "Part-time"];
const estados = ["activo", "suspendido", "vacaciones"];
const estudios = ["Secundaria", "Técnico", "Universitario", "Postgrado"];
const jefes = ["Ana Castillo", "Carlos Mendoza", "Pedro Ruiz"];

export default function NewEmployeePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    nombre: "", dni: "", fechaNacimiento: "", nivelEstudios: "", carrera: "",
    telefono: "", correo: "", direccion: "",
    contactoEmergenciaNombre: "", contactoEmergenciaTelefono: "",
    banco: "", numeroCuenta: "", prevision: "",
    puesto: "", area: "", modalidad: "", horario: "", sueldo: "",
    tipoContrato: "", fechaInicio: "", fechaFin: "",
    jefeDirecto: "", estado: "activo",
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    toast({ title: "Empleado creado", description: `${form.nombre || "Nuevo empleado"} ha sido registrado exitosamente.` });
    navigate("/empleados");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/empleados">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver a empleados
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Nuevo Empleado</h1>
        <p className="text-muted-foreground text-sm mt-1">Complete la información del nuevo colaborador</p>
      </div>

      {/* Datos Personales */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Datos Personales</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <Button variant="outline" size="sm">Subir foto</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input placeholder="Ej: Juan Pérez García" value={form.nombre} onChange={e => update("nombre", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>DNI</Label>
              <Input placeholder="Ej: 72345678" maxLength={8} value={form.dni} onChange={e => update("dni", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de nacimiento</Label>
              <Input type="date" value={form.fechaNacimiento} onChange={e => update("fechaNacimiento", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nivel de estudios</Label>
              <Select value={form.nivelEstudios} onValueChange={v => update("nivelEstudios", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{estudios.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Carrera / Especialidad</Label>
              <Input placeholder="Ej: Ing. Sistemas" value={form.carrera} onChange={e => update("carrera", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label>Antecedentes policiales (PDF)</Label>
              <Input type="file" accept=".pdf" className="cursor-pointer" />
            </div>
            <div className="space-y-2">
              <Label>CV (PDF)</Label>
              <Input type="file" accept=".pdf" className="cursor-pointer" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos de Contacto */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Datos de Contacto</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input placeholder="Ej: 987654321" value={form.telefono} onChange={e => update("telefono", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input type="email" placeholder="Ej: juan@enviamas.pe" value={form.correo} onChange={e => update("correo", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <Label>Dirección</Label>
              <Input placeholder="Ej: Av. Principal 123, Lima" value={form.direccion} onChange={e => update("direccion", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contacto de emergencia — Nombre</Label>
              <Input placeholder="Ej: Rosa Pérez" value={form.contactoEmergenciaNombre} onChange={e => update("contactoEmergenciaNombre", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contacto de emergencia — Teléfono</Label>
              <Input placeholder="Ej: 912345678" value={form.contactoEmergenciaTelefono} onChange={e => update("contactoEmergenciaTelefono", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos Bancarios */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Datos Bancarios y Previsionales</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Banco</Label>
              <Select value={form.banco} onValueChange={v => update("banco", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar banco" /></SelectTrigger>
                <SelectContent>{bancos.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Número de cuenta</Label>
              <Input placeholder="Ej: 19112345678901" value={form.numeroCuenta} onChange={e => update("numeroCuenta", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sistema previsional</Label>
              <Select value={form.prevision} onValueChange={v => update("prevision", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{previsiones.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos Laborales */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Datos Laborales</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Área</Label>
              <Select value={form.area} onValueChange={v => update("area", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar área" /></SelectTrigger>
                <SelectContent>{areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Puesto</Label>
              <Select value={form.puesto} onValueChange={v => update("puesto", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar puesto" /></SelectTrigger>
                <SelectContent>{puestos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modalidad</Label>
              <Select value={form.modalidad} onValueChange={v => update("modalidad", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{modalidades.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Horario laboral</Label>
              <Input placeholder="Ej: 09:00 - 18:00" value={form.horario} onChange={e => update("horario", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sueldo (S/)</Label>
              <Input type="number" placeholder="Ej: 2500" value={form.sueldo} onChange={e => update("sueldo", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de contrato</Label>
              <Select value={form.tipoContrato} onValueChange={v => update("tipoContrato", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{contratos.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de inicio</Label>
              <Input type="date" value={form.fechaInicio} onChange={e => update("fechaInicio", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha fin de contrato</Label>
              <Input type="date" value={form.fechaFin} onChange={e => update("fechaFin", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Jefe directo</Label>
              <Select value={form.jefeDirecto} onValueChange={v => update("jefeDirecto", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar jefe" /></SelectTrigger>
                <SelectContent>{jefes.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado inicial</Label>
              <Select value={form.estado} onValueChange={v => update("estado", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{estados.map(e => <SelectItem key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <Label>Contrato (PDF)</Label>
            <Input type="file" accept=".pdf" className="cursor-pointer" />
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex justify-end gap-3 pb-6">
        <Link to="/empleados">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button className="gap-2" onClick={handleSave}>
          <Save className="w-4 h-4" /> Guardar Empleado
        </Button>
      </div>
    </div>
  );
}
