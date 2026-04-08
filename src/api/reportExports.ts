import { ApiHttpError, buildApiUrl } from "@/api/client";
import { getAuthToken } from "@/api/authToken";
import { parseApiErrorResponseText } from "@/api/parseApiErrorResponse";

function parseFilenameFromContentDisposition(cd: string | null): string | null {
  if (!cd) return null;
  const utf8 = /filename\*=UTF-8''([^;\n]+)/i.exec(cd);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      return utf8[1].trim();
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(cd);
  if (quoted?.[1]) return quoted[1].trim();
  const plain = /filename=([^;\n]+)/i.exec(cd);
  return plain?.[1]?.trim().replace(/^["']|["']$/g, "") ?? null;
}

export async function downloadReportCsv(pathWithQuery: string): Promise<void> {
  const url = buildApiUrl(pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getAuthToken() ?? ""}`,
      Accept: "text/csv,*/*",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiHttpError(res.status, parseApiErrorResponseText(text, res.status, res.statusText));
  }
  const blob = await res.blob();
  const name = parseFilenameFromContentDisposition(res.headers.get("Content-Disposition")) ?? "reporte.csv";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function downloadReportXlsx(pathWithQuery: string): Promise<void> {
  const url = buildApiUrl(pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getAuthToken() ?? ""}`,
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiHttpError(res.status, parseApiErrorResponseText(text, res.status, res.statusText));
  }
  const blob = await res.blob();
  const name = parseFilenameFromContentDisposition(res.headers.get("Content-Disposition")) ?? "reporte.xlsx";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function downloadReportPdf(pathWithQuery: string): Promise<void> {
  const url = buildApiUrl(pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getAuthToken() ?? ""}`,
      Accept: "application/pdf,*/*",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiHttpError(res.status, parseApiErrorResponseText(text, res.status, res.statusText));
  }
  const blob = await res.blob();
  const name = parseFilenameFromContentDisposition(res.headers.get("Content-Disposition")) ?? "reporte.pdf";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function downloadReportZip(pathWithQuery: string): Promise<void> {
  const url = buildApiUrl(pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getAuthToken() ?? ""}`,
      Accept: "application/zip,application/octet-stream,*/*",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiHttpError(res.status, parseApiErrorResponseText(text, res.status, res.statusText));
  }
  const blob = await res.blob();
  const name = parseFilenameFromContentDisposition(res.headers.get("Content-Disposition")) ?? "archivo.zip";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
