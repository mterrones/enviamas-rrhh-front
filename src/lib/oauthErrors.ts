export function oauthErrorMessage(code: string): string {
  const map: Record<string, string> = {
    oauth_not_configured:
      "Google OAuth no está activo o incompleto en el servidor (credenciales, dominio permitido y activación en .env; configuración en Google Cloud Console).",
    oauth_failed: "No se pudo validar la sesión con Google. Intenta de nuevo.",
    oauth_no_email: "Google no devolvió un correo. No se puede continuar.",
    domain_not_allowed: "Solo se permiten cuentas del dominio corporativo.",
    account_inactive: "Tu cuenta está desactivada. Contacta a Recursos Humanos.",
    invite_email_mismatch:
      "El correo de Google no coincide con la invitación. Inicia sesión solo con la cuenta invitada.",
    invite_invalid: "Este enlace de invitación no es válido o ya fue usado.",
    invite_expired: "Esta invitación expiró. Pide al administrador que genere una nueva.",
  };
  return map[code] ?? "No se pudo completar el acceso con Google.";
}
