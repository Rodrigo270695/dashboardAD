import { normalizeBaseFecha } from "@/lib/dates";
import type { VentaRow } from "@/lib/venta";

export const CUOTA_SOCIO = "MACGA";
export const CUOTA_ZONAL = "CHICLAYO";
export const CUOTA_ACCION = "PDV REGULAR";

export type SemaforoColor = "green" | "amber" | "red";

export interface CuotaDateColumn {
  isoDate: string;
  columnIndex: number;
  header: string;
}

export interface CuotaVendorEntry {
  displayName: string;
  peso: number;
  quotas: Map<string, number>;
}

export interface ParsedCuotaSheet {
  vendors: Map<string, CuotaVendorEntry>;
  dateColumns: CuotaDateColumn[];
}

export interface CuotaTableRow {
  nombre: string;
  cuota: number;
  corte: number;
  porcentaje: number;
  semaforo: SemaforoColor;
}

export interface CuotaTableData {
  title: string;
  volumenLabel: string;
  rows: CuotaTableRow[];
  totals: CuotaTableRow;
  selectedDates: string[];
  availableDates: string[];
  socioFilter: string;
  zonalFilter: string;
}

export function vendorMatchKey(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^(CHI|JAE)\s+/, "")
    .replace(/\s+/g, " ");
}

function parsePeso(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace("%", "").replace(",", ".").trim();
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function parseQuotaValue(value: string | undefined): number {
  if (!value?.trim()) return 0;
  const num = Number.parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(num) ? num : 0;
}

function parseSheetDateHeader(header: string): string | null {
  const normalized = normalizeBaseFecha(header);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

export function parseCuotaSheet(values: string[][]): ParsedCuotaSheet {
  const vendors = new Map<string, CuotaVendorEntry>();
  const dateColumns: CuotaDateColumn[] = [];

  if (values.length <= 1) {
    return { vendors, dateColumns };
  }

  const [headerRow, ...dataRows] = values;

  for (let columnIndex = 2; columnIndex < headerRow.length; columnIndex++) {
    const header = headerRow[columnIndex]?.trim() ?? "";
    const isoDate = parseSheetDateHeader(header);
    if (isoDate) {
      dateColumns.push({ isoDate, columnIndex, header });
    }
  }

  for (const cells of dataRows) {
    const pdvRegular = cells[0]?.trim();
    if (!pdvRegular) continue;

    const key = vendorMatchKey(pdvRegular);
    const quotas = new Map<string, number>();

    for (const { isoDate, columnIndex } of dateColumns) {
      quotas.set(isoDate, parseQuotaValue(cells[columnIndex]));
    }

    vendors.set(key, {
      displayName: pdvRegular,
      peso: parsePeso(cells[1]),
      quotas,
    });
  }

  return { vendors, dateColumns };
}

export function getCuotaAvailableDates(rows: VentaRow[]): string[] {
  const dates = new Set<string>();

  for (const row of rows) {
    if (!matchesCuotaFilters(row)) continue;
    const fecha = row.fecha.trim();
    if (fecha) dates.add(fecha);
  }

  return [...dates].sort();
}

export function matchesCuotaFilters(row: VentaRow): boolean {
  return (
    row.socio.trim().toUpperCase() === CUOTA_SOCIO &&
    row.zonal.trim().toUpperCase() === CUOTA_ZONAL &&
    row.accion.trim().toUpperCase() === CUOTA_ACCION
  );
}

export function getChiclayoVendorKeys(rows: VentaRow[]): string[] {
  const keys = new Set<string>();

  for (const row of rows) {
    if (!matchesCuotaFilters(row)) continue;
    const nombre = row.nombreVendedorZonificado.trim();
    if (nombre) keys.add(vendorMatchKey(nombre));
  }

  return [...keys].sort((a, b) => a.localeCompare(b, "es"));
}

function computeCorte(
  rows: VentaRow[],
  vendorKey: string,
  dates: string[],
  tipo: "prepago" | "postpago",
): number {
  const dateSet = new Set(dates);
  let count = 0;

  for (const row of rows) {
    if (!matchesCuotaFilters(row)) continue;
    if (!dateSet.has(row.fecha.trim())) continue;
    if (vendorMatchKey(row.nombreVendedorZonificado) !== vendorKey) continue;

    const producto = row.producto.trim().toLowerCase();
    const operacion = row.operacion.trim().toLowerCase();

    if (
      tipo === "prepago" &&
      producto === "prepago" &&
      (operacion === "alta" || operacion === "portabilidad")
    ) {
      count += 1;
    }

    if (
      tipo === "postpago" &&
      producto === "postpago" &&
      (operacion === "alta" || operacion === "portabilidad")
    ) {
      count += 1;
    }
  }

  return count;
}

function computeCuota(
  sheet: ParsedCuotaSheet,
  vendorKey: string,
  dates: string[],
): number {
  const vendor = sheet.vendors.get(vendorKey);
  if (!vendor) return 0;

  return dates.reduce((sum, date) => sum + (vendor.quotas.get(date) ?? 0), 0);
}

export function calcPorcentaje(corte: number, cuota: number): number {
  if (cuota <= 0) return 0;
  return Math.round((corte / cuota) * 100);
}

export function getSemaforo(porcentaje: number): SemaforoColor {
  if (porcentaje >= 100) return "green";
  if (porcentaje >= 90) return "amber";
  return "red";
}

function resolveDisplayName(
  vendorKey: string,
  sheet: ParsedCuotaSheet,
  rows: VentaRow[],
): string {
  const fromSheet = sheet.vendors.get(vendorKey)?.displayName;
  if (fromSheet) return fromSheet;

  for (const row of rows) {
    if (!matchesCuotaFilters(row)) continue;
    if (vendorMatchKey(row.nombreVendedorZonificado) === vendorKey) {
      return row.nombreVendedorZonificado.trim();
    }
  }

  return vendorKey;
}

export function buildCuotaTable(
  rows: VentaRow[],
  sheet: ParsedCuotaSheet,
  selectedDates: string[],
  tipo: "prepago" | "postpago",
): CuotaTableData {
  const availableDates = getCuotaAvailableDates(rows);
  const effectiveDates =
    selectedDates.length > 0
      ? selectedDates.filter((date) => availableDates.includes(date))
      : availableDates;

  const vendorKeys = getChiclayoVendorKeys(rows);
  const tableRows: CuotaTableRow[] = vendorKeys.map((key) => {
    const cuota = computeCuota(sheet, key, effectiveDates);
    const corte = computeCorte(rows, key, effectiveDates, tipo);
    const porcentaje = calcPorcentaje(corte, cuota);

    return {
      nombre: resolveDisplayName(key, sheet, rows),
      cuota,
      corte,
      porcentaje,
      semaforo: getSemaforo(porcentaje),
    };
  });

  tableRows.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const totalCuota = tableRows.reduce((sum, row) => sum + row.cuota, 0);
  const totalCorte = tableRows.reduce((sum, row) => sum + row.corte, 0);
  const totalPorcentaje = calcPorcentaje(totalCorte, totalCuota);

  return {
    title:
      tipo === "prepago"
        ? "CUOTA ESTACIONAL PREPAGO"
        : "CUOTA ESTACIONAL POSTPAGO",
    volumenLabel:
      tipo === "prepago" ? "VOLUMEN PREPAGO" : "VOLUMEN POSTPAGO",
    rows: tableRows,
    totals: {
      nombre: "TOTALES",
      cuota: totalCuota,
      corte: totalCorte,
      porcentaje: totalPorcentaje,
      semaforo: getSemaforo(totalPorcentaje),
    },
    selectedDates: effectiveDates,
    availableDates,
    socioFilter: CUOTA_SOCIO,
    zonalFilter: CUOTA_ZONAL,
  };
}
