import { getSheetValues } from "@/lib/google-sheets";
import { emptyMmPdvEntry, type MmPdvEntry } from "@/lib/mm-pdv";
import type { VentaRow } from "@/lib/venta";

export type { VentaRow } from "@/lib/venta";

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function buildHeaderIndex(headers: string[]): Map<string, number> {
  const index = new Map<string, number>();

  headers.forEach((header, columnIndex) => {
    index.set(normalizeHeader(header), columnIndex);
  });

  return index;
}

function getCell(
  cells: string[],
  headerIndex: Map<string, number>,
  candidates: string[],
): string {
  for (const candidate of candidates) {
    const columnIndex = headerIndex.get(normalizeHeader(candidate));
    if (columnIndex !== undefined) {
      return cells[columnIndex]?.trim() ?? "";
    }
  }

  return "";
}

function toVentaRow(
  cells: string[],
  headerIndex: Map<string, number>,
  lookup: Map<string, MmPdvEntry>,
): VentaRow {
  const dniResponsable = getCell(cells, headerIndex, ["DNI_RESPONSABLE"]);
  const mmEntry = lookup.get(dniResponsable) ?? emptyMmPdvEntry();

  return {
    fecha: getCell(cells, headerIndex, ["FECHA"]),
    dniVendedor: getCell(cells, headerIndex, ["DNI_VENDEDOR"]),
    dniResponsable,
    socio: getCell(cells, headerIndex, ["SOCIO"]),
    zonal: getCell(cells, headerIndex, ["ZONAL"]),
    accion: getCell(cells, headerIndex, ["ACCION", "ACCIÓN"]),
    region: getCell(cells, headerIndex, ["REGION", "REGIÓN"]),
    identificador: getCell(cells, headerIndex, ["IDENTIFICADOR"]),
    operacion: getCell(cells, headerIndex, ["OPERACIÓN", "OPERACION"]),
    producto: getCell(cells, headerIndex, ["PRODUCTO"]),
    hora: getCell(cells, headerIndex, ["HORA"]),
    canalComercial: getCell(cells, headerIndex, ["CANAL COMERCIAL"]),
    codigoPuntoVenta: getCell(cells, headerIndex, [
      "CODIGO PUNTO DE VENTA",
      "CÓDIGO PUNTO DE VENTA",
    ]),
    nombreVendedorZonificado: mmEntry.nombreVendedorZonificado,
    multimarca: mmEntry.multimarca,
  };
}

export function parseBaseValues(
  values: string[][],
  lookup: Map<string, MmPdvEntry>,
): VentaRow[] {
  if (values.length <= 1) {
    return [];
  }

  const [headerRow, ...dataRows] = values;
  const headerIndex = buildHeaderIndex(headerRow);

  return dataRows
    .map((cells) => toVentaRow(cells, headerIndex, lookup))
    .filter((row) => row.fecha || row.identificador);
}

export function parseMmPdvLookup(values: string[][]): Map<string, MmPdvEntry> {
  if (values.length <= 1) {
    return new Map();
  }

  const [headerRow, ...dataRows] = values;
  const headerIndex = buildHeaderIndex(headerRow);
  const lookup = new Map<string, MmPdvEntry>();

  for (const cells of dataRows) {
    const dniResponsable = getCell(cells, headerIndex, [
      "DNI_Responsable",
      "DNI_RESPONSABLE",
    ]);
    const nombre = getCell(cells, headerIndex, [
      "Nombre_Vendedor_Zonificado",
      "NOMBRE_VENDEDOR_ZONIFICADO",
    ]);
    const multimarca = getCell(cells, headerIndex, [
      "Nombre y Apellido Multimarca/Pdv",
      "Nombre y Apellido Multimarca/PDV",
      "NOMBRE Y APELLIDO MULTIMARCA/PDV",
    ]);

    if (dniResponsable && (nombre || multimarca)) {
      lookup.set(dniResponsable, {
        nombreVendedorZonificado: nombre || "Sin vendedor zonificado",
        multimarca: multimarca || "Sin multimarca",
      });
    }
  }

  return lookup;
}

export async function fetchVentas(): Promise<VentaRow[]> {
  const baseRange = process.env.GOOGLE_SHEETS_RANGE_1 ?? "Base!A:Z";
  const mmRange =
    process.env.GOOGLE_SHEETS_RANGE_2 ?? "'Base MM PDV'!A:Z";

  const [baseValues, mmValues] = await Promise.all([
    getSheetValues(baseRange),
    getSheetValues(mmRange),
  ]);

  const lookup = parseMmPdvLookup(mmValues);
  return parseBaseValues(baseValues, lookup);
}

export async function fetchCuotaSheets(): Promise<{
  prepago: string[][];
  postpago: string[][];
}> {
  const prepagoRange =
    process.env.GOOGLE_SHEETS_RANGE_CUOTA_PREPAGO ?? "'Cuota Prepago'!A:AG";
  const postpagoRange =
    process.env.GOOGLE_SHEETS_RANGE_CUOTA_POSTPAGO ?? "'Cuota Postpago'!A:AG";

  const [prepago, postpago] = await Promise.all([
    getSheetValues(prepagoRange),
    getSheetValues(postpagoRange),
  ]);

  return { prepago, postpago };
}

export async function fetchDashboardData(): Promise<{
  rows: VentaRow[];
  cuotaPrepago: string[][];
  cuotaPostpago: string[][];
}> {
  const [rows, cuotaSheets] = await Promise.all([
    fetchVentas(),
    fetchCuotaSheets(),
  ]);

  return {
    rows,
    cuotaPrepago: cuotaSheets.prepago,
    cuotaPostpago: cuotaSheets.postpago,
  };
}
