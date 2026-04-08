import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiHttpError } from "@/api/client";
import { fetchPayrollPeriodAggregates, type PayrollPeriodAggregatesData } from "@/api/dashboardSummary";

function formatMoney(s: string): string {
  const n = Number(s);
  if (Number.isNaN(n)) return s;
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type PayrollPeriodAggregatesCardProps = {
  limit?: number;
};

export function PayrollPeriodAggregatesCard({ limit = 6 }: PayrollPeriodAggregatesCardProps) {
  const [data, setData] = useState<PayrollPeriodAggregatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPayrollPeriodAggregates({ limit })
      .then((r) => {
        if (!cancelled) setData(r.data);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const msg =
            e instanceof ApiHttpError ? e.apiError?.message ?? e.message : "No se pudieron cargar los totales";
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
  }, [limit]);

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Totales de planilla por período</CardTitle>
        {data != null ? (
          <p className="text-xs text-muted-foreground font-normal leading-relaxed">
            {data.definitions.primary} {data.definitions.summary}
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Cargando…</p>
        ) : error ? (
          <p className="text-sm text-destructive py-6">{error}</p>
        ) : data == null || data.periods.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No hay periodos de planilla.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-2">Período</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-2">Bruto</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-2">Descuentos</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-2">Neto</th>
                </tr>
              </thead>
              <tbody>
                {data.periods.map((p) => (
                  <tr key={p.payroll_period_id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 tabular-nums">
                      {String(p.month).padStart(2, "0")}/{p.year}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">S/ {formatMoney(p.gross_total)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">S/ {formatMoney(p.deductions_total)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">S/ {formatMoney(p.net_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
