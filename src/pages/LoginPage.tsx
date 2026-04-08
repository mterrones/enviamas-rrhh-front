import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiHttpError, buildApiUrl } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { INACTIVE_LOGOUT_SESSION_KEY } from "@/constants/inactivity";

function readInactiveLogoutFlag(): boolean {
  try {
    if (globalThis.sessionStorage?.getItem(INACTIVE_LOGOUT_SESSION_KEY) === "1") {
      globalThis.sessionStorage?.removeItem(INACTIVE_LOGOUT_SESSION_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === "true";

function oauthErrorMessage(code: string): string {
  const map: Record<string, string> = {
    oauth_not_configured:
      "Google OAuth no está activo o incompleto en el servidor (credenciales, dominio permitido y activación en .env; configuración en Google Cloud Console).",
    oauth_failed: "No se pudo validar la sesión con Google. Intenta de nuevo.",
    oauth_no_email: "Google no devolvió un correo. No se puede continuar.",
    domain_not_allowed: "Solo se permiten cuentas del dominio corporativo.",
  };
  return map[code] ?? "No se pudo iniciar sesión con Google.";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithToken, user, initializing } = useAuth();
  const [inactiveLogout] = useState(readInactiveLogoutFlag);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initializing && user) {
      navigate("/", { replace: true });
    }
  }, [initializing, user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      setError(oauthErrorMessage(err));
      window.history.replaceState(null, "", window.location.pathname);
    }
    const h = window.location.hash;
    if (!h || !h.includes("token=")) {
      return;
    }
    const sp = new URLSearchParams(h.startsWith("#") ? h.slice(1) : h);
    const token = sp.get("token");
    if (!token) {
      return;
    }
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    void (async () => {
      setSubmitting(true);
      setError(null);
      try {
        await loginWithToken(token);
        navigate("/", { replace: true });
      } catch {
        setError("No se pudo completar el inicio de sesión con Google.");
      } finally {
        setSubmitting(false);
      }
    })();
  }, [loginWithToken, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiHttpError) {
        const msg = err.apiError?.message ?? err.message;
        setError(typeof msg === "string" ? msg : "No se pudo iniciar sesión");
      } else {
        setError("No se pudo iniciar sesión");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 text-muted-foreground text-sm">
        Cargando…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md shadow-card-hover">
        <CardContent className="p-8 flex flex-col items-center space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">EM</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">EnviaMas RRHH</h1>
              <p className="text-xs text-muted-foreground">Plataforma de Recursos Humanos</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="w-full space-y-4">
            <p className="text-center text-sm text-muted-foreground">Inicia sesión para acceder al sistema</p>
            {inactiveLogout ? (
              <p className="text-center text-sm text-muted-foreground" role="status">
                Sesión cerrada por inactividad. Vuelve a iniciar sesión.
              </p>
            ) : null}
            {error ? (
              <p className="text-sm text-destructive text-center" role="alert">
                {error}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>

          {GOOGLE_AUTH_ENABLED ? (
            <>
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">o</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                disabled={submitting}
                onClick={() => {
                  window.location.href = buildApiUrl("/auth/google/redirect");
                }}
              >
                Continuar con Google
              </Button>
            </>
          ) : null}

          <p className="text-xs text-muted-foreground text-center">
            © 2026 EnviaMas S.A.C. — Tecnología de Comunicaciones
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
