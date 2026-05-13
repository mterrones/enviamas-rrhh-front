export function normalizeMoneyDecimalInput(raw: string): string {
  if (raw === "") return "";
  const unified = raw.replace(/,/g, ".");
  const filtered = unified.replace(/[^\d.]/g, "");
  if (filtered === "") return "";

  const firstDot = filtered.indexOf(".");
  const core =
    firstDot === -1
      ? filtered
      : filtered.slice(0, firstDot + 1) + filtered.slice(firstDot + 1).replace(/\./g, "");

  const endsWithDot = core.endsWith(".");
  const dotIdx = core.indexOf(".");
  const intRaw = dotIdx === -1 ? core : core.slice(0, dotIdx);
  const afterDot = dotIdx === -1 ? "" : core.slice(dotIdx + 1);

  let intPart = intRaw.replace(/^0+/, "");
  if (intPart === "") intPart = "0";

  const decPart = afterDot.slice(0, 2);

  if (dotIdx !== -1) {
    if (decPart.length > 0) return `${intPart}.${decPart}`;
    if (endsWithDot) return `${intPart}.`;
  }

  return intPart;
}
