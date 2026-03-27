import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const headcountData = [
  { mes: "Oct", total: 220 }, { mes: "Nov", total: 228 }, { mes: "Dic", total: 235 },
  { mes: "Ene", total: 238 }, { mes: "Feb", total: 242 }, { mes: "Mar", total: 247 },
];

const absenteeismData = [
  { mes: "Oct", tasa: 3.2 }, { mes: "Nov", tasa: 2.8 }, { mes: "Dic", tasa: 4.1 },
  { mes: "Ene", tasa: 3.5 }, { mes: "Feb", tasa: 2.9 }, { mes: "Mar", tasa: 3.0 },
];

const contractsExpiring = [
  { nombre: "Juan Pérez", area: "Contact Center", vencimiento: "02/04/2026", tipo: "Plazo Fijo" },
  { nombre: "María López", area: "Chat Bot", vencimiento: "05/04/2026", tipo: "Plazo Fijo" },
  { nombre: "Ana Torres", area: "TI", vencimiento: "18/04/2026", tipo: "Locación de Servicios" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reportes y Analítica</h1>
          <p className="text-muted-foreground text-sm mt-1">Indicadores clave y reportes exportables</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"><Download className="w-4 h-4" />Excel</Button>
          <Button variant="outline" size="sm" className="gap-1.5"><FileText className="w-4 h-4" />PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">Evolución de Headcount</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={headcountData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#ec6d1f" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">Tasa de Ausentismo (%)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={absenteeismData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="tasa" stroke="#f4ad08" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[["Rotación Mensual", "4.2%", "Promedio últimos 6 meses"], ["Costo Planilla", "S/ 385,000", "Marzo 2026"], ["Días Promedio Ausencia", "1.8", "Por empleado/mes"]].map(([t, v, d]) => (
          <Card key={t} className="shadow-card">
            <CardContent className="p-5 text-center">
              <p className="text-sm text-muted-foreground">{t}</p>
              <p className="text-3xl font-bold mt-2">{v}</p>
              <p className="text-xs text-muted-foreground mt-1">{d}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Contratos por Vencer</CardTitle>
          <Select defaultValue="30"><SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="15">Próximos 15 días</SelectItem><SelectItem value="30">Próximos 30 días</SelectItem><SelectItem value="60">Próximos 60 días</SelectItem></SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead><tr className="border-b border-border bg-muted/50">
              {["Empleado", "Área", "Tipo Contrato", "Vencimiento"].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {contractsExpiring.map(c => (
                <tr key={c.nombre} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-sm font-medium">{c.nombre}</td>
                  <td className="px-5 py-3 text-sm">{c.area}</td>
                  <td className="px-5 py-3 text-sm">{c.tipo}</td>
                  <td className="px-5 py-3 text-sm text-warning font-medium">{c.vencimiento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
