import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ListPaginationBarProps = {
  page: number;
  lastPage: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  className?: string;
};

export function ListPaginationBar({
  page,
  lastPage,
  total,
  pageSize,
  onPageChange,
  loading,
  className,
}: ListPaginationBarProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  if (lastPage <= 1 && total >= 0) {
    return (
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-2 border-t border-border",
          className,
        )}
      >
        <p className="text-xs text-muted-foreground">
          {total === 0 ? "Sin registros" : `${total} registro(s)`}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-2 border-t border-border",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        Mostrando {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          Página {page} / {lastPage}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={loading || page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
