/** Convierte valor de hoja (ej. 130 → 01:30, 1314 → 13:14). */
export function formatHoraSheet(value: string): string | null {
  const digits = value.trim().replace(/\D/g, "");
  if (!digits) return null;

  const num = Number.parseInt(digits, 10);
  if (!Number.isFinite(num) || num < 0) return null;

  const minutes = num % 100;
  const hours = Math.floor(num / 100);

  if (minutes > 59) return null;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/** Minutos totales desde medianoche para comparar horas. */
export function horaSheetToMinutes(value: string): number | null {
  const formatted = formatHoraSheet(value);
  if (!formatted) return null;

  const [hours, minutes] = formatted.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Devuelve la hora más tardía de la columna HORA, formateada HH:MM. */
export function getUltimaHoraCorte(values: string[]): string | null {
  let maxMinutes = -1;
  let latest: string | null = null;

  for (const value of values) {
    const minutes = horaSheetToMinutes(value);
    const formatted = formatHoraSheet(value);

    if (minutes === null || formatted === null) continue;
    if (minutes > maxMinutes) {
      maxMinutes = minutes;
      latest = formatted;
    }
  }

  return latest;
}
