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

/** Convierte serial de Google Sheets/Excel a ISO (YYYY-MM-DD). */
export function sheetsSerialToIso(serial: number): string | null {
  if (!Number.isFinite(serial) || serial <= 0) return null;

  const utcMs = Math.round((serial - 25569) * 86400 * 1000);
  const date = new Date(utcMs);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}

/**
 * Normaliza FECHA de la hoja Base a ISO (YYYY-MM-DD).
 * Acepta: YYYY-MM-DD, DD/MM/YYYY o serial de Sheets.
 */
export function normalizeBaseFecha(fecha: string): string {
  const trimmed = fecha.trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const fromDmy = parseCuotaDateHeader(trimmed);
  if (fromDmy) return fromDmy;

  const serial = Number(trimmed);
  if (Number.isFinite(serial)) {
    const fromSerial = sheetsSerialToIso(serial);
    if (fromSerial) return fromSerial;
  }

  return trimmed;
}

/** Formato legible para selects (ej. 29/05/2026). */
export function formatDateLabel(isoDate: string): string {
  return isoToCuotaHeader(isoDate);
}
