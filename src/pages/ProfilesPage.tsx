import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ShieldCheck } from "lucide-react";
import { ApiHttpError } from "@/api/client";
import { fetchRolesList, type RoleListItem } from "@/api/roles";

export default function ProfilesPage() {
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchRolesList()
      .then((res) => {
        if (!cancelled) setRoles(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            err instanceof ApiHttpError ? err.apiError?.message ?? err.message : "No se pudieron cargar los roles";
          setError(typeof msg === "string" ? msg : "Error");
          setRoles([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Roles del sistema</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
          Consulta de roles y permisos efectivos en el servidor (solo lectura). La asignación de cada usuario a un rol se gestiona en{" "}
          <span className="font-medium text-foreground">Configuración</span> → <span className="font-medium text-foreground">Usuarios</span>.
          Despliega cada rol para ver sus permisos; no se pueden modificar aquí.
        </p>
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <Link to="/configuracion">Ir a Configuración</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Roles registrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground px-6 py-8">Cargando roles…</p>
          ) : error ? (
            <p className="text-sm text-destructive px-6 py-8">{error}</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-8">No hay roles en el servidor. Ejecuta el seed RBAC o revisa la base de datos.</p>
          ) : (
            <Accordion type="multiple" className="w-full px-6 pb-4">
              {roles.map((r) => (
                <AccordionItem key={r.id} value={`role-${r.id}`} className="border-b last:border-b-0">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <div className="flex flex-1 flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 pr-2">
                      <div>
                        <p className="font-medium text-foreground text-sm">{r.name ?? r.slug}</p>
                        <p className="text-xs text-muted-foreground font-normal mt-0.5">
                          <code className="bg-muted px-1.5 py-0.5 rounded">{r.slug}</code>
                          <span className="text-muted-foreground/80"> · ID {r.id}</span>
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground font-normal tabular-nums shrink-0">
                        {r.permissions.length} permiso{r.permissions.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {r.permissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground pb-2">Este rol no tiene permisos asignados en base de datos.</p>
                    ) : (
                      <ul className="list-none space-y-2 pb-2 border-l-2 border-muted pl-3 ml-1">
                        {r.permissions.map((p) => (
                          <li key={p.id} className="text-sm">
                            <code className="text-xs bg-muted px-2 py-0.5 rounded">{p.slug}</code>
                            {p.name ? (
                              <span className="text-muted-foreground ml-2">{p.name}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
