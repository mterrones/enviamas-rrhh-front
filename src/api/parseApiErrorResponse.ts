const maxPlainErrorChars = 2000;

export function isLikelyHtmlResponseBody(text: string): boolean {
  const t = text.trimStart();
  return t.startsWith("<!DOCTYPE") || t.startsWith("<!doctype") || /^<\s*html[\s>]/i.test(t);
}

export function parseApiErrorResponseText(text: string, status: number, statusText: string): unknown {
  if (!text.trim()) {
    return { message: statusText || `Error HTTP ${status}` };
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    if (isLikelyHtmlResponseBody(text)) {
      return {
        message: `Respuesta no válida del servidor (HTTP ${status}). Comprueba la URL del API (VITE_API_BASE_URL) y que el backend esté levantado.`,
      };
    }
    const truncated = text.length > maxPlainErrorChars ? `${text.slice(0, maxPlainErrorChars)}…` : text;
    return { message: truncated || statusText || `Error HTTP ${status}` };
  }
}
