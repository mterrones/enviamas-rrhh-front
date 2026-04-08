import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ApiHttpError } from "@/api/client";
import { fetchMonthlyHireExitFlow, type MonthlyHireExitFlowData } from "@/api/dashboardSummary";

function formatMonthShort(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("es-PE", { month: "short", year: "numeric" });
}

type MonthlyHireExitFlowCardProps = {
  months?: number;
  title: string;
};

export function MonthlyHireExitFlowCard({ months = 6, title }: MonthlyHireExitFlowCardProps) {
  const [data, setData] = useState<MonthlyHireExitFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMonthlyHireExitFlow({ months })
      .then((r) => {
        if (!cancelled) setData(r.data);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const msg =
            e instanceof ApiHttpError ? e.apiError?.message ?? e.message : "No se pudo cargar la serie";
          setError(typeof msg === "string" ? msg : "Error");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [months]);

  const chartData =
    data?.series.map((p) => ({
      label: formatMonthShort(p.month),
      Altas: p.hires,
      Bajas: p.exits,
    })) ?? [];

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {data != null ? (
          <p className="text-xs text-muted-foreground font-normal leading-relaxed">
            {data.definitions.hires} {data.definitions.exits} Últimos {data.months} meses (no es plantilla
            acumulada).
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Cargando…</p>
        ) : error ? (
          <p className="text-sm text-destructive py-6">{error}</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Sin datos en el rango.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" width={36} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Altas" fill="#ec6d1f" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Bajas" fill="#64748b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
