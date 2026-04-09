export function formatEmployeeName(e: { first_name?: string | null; last_name?: string | null }): string {
  return [e.first_name, e.last_name]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .join(" ")
    .trim();
}
