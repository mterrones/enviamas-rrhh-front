import { Users, UserX, FileWarning, ClipboardList, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const metrics = [
  { label: "Empleados Activos", value: "247", icon: Users, trend: "+12", trendUp: true, color: "bg-primary/10 text-primary" },
  { label: "Ausentes Hoy", value: "8", icon: UserX, trend: "-2", trendUp: false, color: "bg-destructive/10 text-destructive" },
  { label: "Contratos por Vencer", value: "5", icon: FileWarning, trend: "+3", trendUp: true, color: "bg-warning/10 text-warning" },
  { label: "Solicitudes Pendientes", value: "12", icon: ClipboardList, trend: "+4", trendUp: true, color: "bg-info/10 text-info" },
];

const headcountData = [
  { mes: "Oct", total: 220 }, { mes: "Nov", total: 228 }, { mes: "Dic", total: 235 },
  { mes: "Ene", total: 238 }, { mes: "Feb", total: 242 }, { mes: "Mar", total: 247 },
];

const rotacionData = [
  { mes: "Oct", ingreso: 8, salida: 4 }, { mes: "Nov", ingreso: 12, salida: 5 },
  { mes: "Dic", ingreso: 6, salida: 3 }, { mes: "Ene", ingreso: 10, salida: 7 },
  { mes: "Feb", ingreso: 9, salida: 5 }, { mes: "Mar", ingreso: 11, salida: 6 },
];

const areaData = [
  { name: "Contact Center", value: 120, color: "#ec6d1f" },
  { name: "Chat Bot", value: 45, color: "#f4ad08" },
  { name: "Campañas", value: 38, color: "#3b82f6" },
  { name: "TI", value: 22, color: "#10b981" },
  { name: "Admin", value: 22, color: "#8b5cf6" },
];

const contractAlerts = [
  { nombre: "Juan Pérez", area: "Contact Center", vencimiento: "2026-04-02", dias: 6 },
  { nombre: "María López", area: "Chat Bot", vencimiento: "2026-04-05", dias: 9 },
  { nombre: "Carlos Mendoza", area: "Campañas", vencimiento: "2026-04-10", dias: 14 },
  { nombre: "Ana Torres", area: "TI", vencimiento: "2026-04-18", dias: 22 },
  { nombre: "Pedro Ruiz", area: "Contact Center", vencimiento: "2026-04-25", dias: 29 },
];

const activityFeed = [
  { action: "Nuevo empleado registrado", detail: "Roberto Sánchez — Contact Center", time: "Hace 30 min" },
  { action: "Vacaciones aprobadas", detail: "María López — 5 días", time: "Hace 2h" },
  { action: "Boleta generada", detail: "Periodo marzo 2026 — 247 boletas", time: "Hace 4h" },
  { action: "Contrato renovado", detail: "Luis Gómez — Indefinido", time: "Ayer" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen general de Recursos Humanos</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="text-3xl font-bold mt-1">{m.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {m.trendUp ? <TrendingUp className="w-3.5 h-3.5 text-success" /> : <TrendingDown className="w-3.5 h-3.5 text-success" />}
                    <span className="text-xs text-success font-medium">{m.trend} este mes</span>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${m.color}`}>
                  <m.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Headcount — Últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribución por Área</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={areaData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {areaData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {areaData.map((a) => (
                <div key={a.name} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: a.color }} />
                  {a.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rotation chart + Contract alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rotación de Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rotacionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="ingreso" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="salida" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Ingresos</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-destructive" /> Salidas</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contratos Próximos a Vencer</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {contractAlerts.map((c) => (
                <div key={c.nombre} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">{c.area}</p>
                  </div>
                  <Badge variant={c.dias <= 7 ? "destructive" : c.dias <= 15 ? "default" : "secondary"} className="text-xs">
                    {c.dias} días
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {activityFeed.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
