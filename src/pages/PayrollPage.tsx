import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Send } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const payrollSummary = [
  { empleado: "Juan Pérez", area: "Contact Center", bruto: "S/ 2,500.00", descuentos: "S/ 325.00", neto: "S/ 2,175.00" },
  { empleado: "María López", area: "Chat Bot", bruto: "S/ 4,200.00", descuentos: "S/ 546.00", neto: "S/ 3,654.00" },
  { empleado: "Carlos Mendoza", area: "Campañas", bruto: "S/ 5,000.00", descuentos: "S/ 650.00", neto: "S/ 4,350.00" },
  { empleado: "Ana Torres", area: "TI", bruto: "S/ 3,000.00", descuentos: "S/ 390.00", neto: "S/ 2,610.00" },
];

export default function PayrollPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Boletas y Nómina</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión de boletas de pago y planilla mensual</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"><Download className="w-4 h-4" />Descarga Masiva</Button>
          <Button size="sm" className="gap-1.5"><Send className="w-4 h-4" />Enviar Notificaciones</Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Select defaultValue="03-2026"><SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="03-2026">Marzo 2026</SelectItem><SelectItem value="02-2026">Febrero 2026</SelectItem></SelectContent>
        </Select>
        <Select defaultValue="all"><SelectTrigger className="w-44"><SelectValue placeholder="Área" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas las áreas</SelectItem><SelectItem value="cc">Contact Center</SelectItem><SelectItem value="cb">Chat Bot</SelectItem></SelectContent>
        </Select>
      </div>

      {/* Boleta Preview */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Vista Previa de Boleta — Juan Pérez</CardTitle></CardHeader>
        <CardContent>
          <div className="border border-border rounded-lg p-5 space-y-4">
            <div className="flex justify-between">
              <div><p className="font-bold">EnviaMas S.A.C.</p><p className="text-xs text-muted-foreground">RUC: 20123456789</p></div>
              <div className="text-right"><p className="text-sm font-medium">Boleta de Pago</p><p className="text-xs text-muted-foreground">Periodo: Marzo 2026</p></div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[["Empleado", "Juan Pérez"], ["DNI", "72345678"], ["Área", "Contact Center"], ["Puesto", "Operador"]].map(([l, v]) => (
                <div key={l}><p className="text-muted-foreground text-xs">{l}</p><p className="font-medium">{v}</p></div>
              ))}
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold mb-2">Ingresos</p>
                {[["Sueldo Básico", "S/ 2,500.00"], ["Asignación Familiar", "S/ 102.50"]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm py-1"><span className="text-muted-foreground">{l}</span><span>{v}</span></div>
                ))}
                <div className="flex justify-between text-sm py-1 font-semibold border-t border-border mt-1 pt-1"><span>Total Ingresos</span><span>S/ 2,602.50</span></div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Descuentos</p>
                {[["AFP Integra (10%)", "S/ 250.00"], ["Seguro (1.36%)", "S/ 34.00"], ["Comisión AFP", "S/ 41.00"]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm py-1"><span className="text-muted-foreground">{l}</span><span>{v}</span></div>
                ))}
                <div className="flex justify-between text-sm py-1 font-semibold border-t border-border mt-1 pt-1"><span>Total Descuentos</span><span>S/ 325.00</span></div>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold"><span>Neto a Pagar</span><span className="text-primary">S/ 2,277.50</span></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="gap-1.5"><FileText className="w-4 h-4" />Generar PDF</Button>
            <Button size="sm" variant="outline" className="gap-1.5"><Send className="w-4 h-4" />Enviar al Empleado</Button>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Summary */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Resumen de Nómina — Marzo 2026</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download className="w-3.5 h-3.5" />Excel</Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" />PDF</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Empleado</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Área</th>
              <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Bruto</th>
              <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Descuentos</th>
              <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Neto</th>
            </tr></thead>
            <tbody>
              {payrollSummary.map((p) => (
                <tr key={p.empleado} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-sm font-medium">{p.empleado}</td>
                  <td className="px-5 py-3 text-sm">{p.area}</td>
                  <td className="px-5 py-3 text-sm text-right">{p.bruto}</td>
                  <td className="px-5 py-3 text-sm text-right text-destructive">{p.descuentos}</td>
                  <td className="px-5 py-3 text-sm text-right font-semibold">{p.neto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
