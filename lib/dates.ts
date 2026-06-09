/** Convierte fecha ISO (YYYY-MM-DD) a cabecera de cuota (DD/MM/YYYY). */
export function isoToCuotaHeader(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
}

/** Parsea cabecera DD/MM/YYYY a ISO (YYYY-MM-DD). */
export function parseCuotaDateHeader(header: string): string | null {
  const match = header.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** Formato legible para selects (ej. 29/05/2026). */
export function formatDateLabel(isoDate: string): string {
  return isoToCuotaHeader(isoDate);
}
