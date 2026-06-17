import type { VentaRow } from "@/lib/venta";

export const PIVOT_SOCIO_FILTER = "MACGA";
export const PIVOT_ACCION_FILTER = "PDV REGULAR";

export interface PivotMetrics {
  postpagoAlta: number;
  postpagoPortabilidad: number;
  prepagoAlta: number;
  prepagoPortabilidad: number;
}

export interface PivotMultimarcaRow {
  id: string;
  multimarca: string;
  metrics: PivotMetrics;
}

export interface PivotVendedorRow {
  id: string;
  nombreVendedorZonificado: string;
  metrics: PivotMetrics;
  multimarcas: PivotMultimarcaRow[];
}

export interface PivotZonalGroup {
  zonal: string;
  metrics: PivotMetrics;
  vendedores: PivotVendedorRow[];
}

export interface PivotTableData {
  groups: PivotZonalGroup[];
  totals: PivotMetrics;
  totalRows: number;
  totalVendedores: number;
  totalMultimarcas: number;
  socioFilter: string;
  accionFilter: string;
}

export function emptyMetrics(): PivotMetrics {
  return {
    postpagoAlta: 0,
    postpagoPortabilidad: 0,
    prepagoAlta: 0,
    prepagoPortabilidad: 0,
  };
}

export function addToMetrics(metrics: PivotMetrics, row: VentaRow) {
  const producto = row.producto.toLowerCase();
  const operacion = row.operacion.toLowerCase();

  if (producto === "postpago" && operacion === "alta") {
    metrics.postpagoAlta += 1;
  } else if (producto === "postpago" && operacion === "portabilidad") {
    metrics.postpagoPortabilidad += 1;
  } else if (producto === "prepago" && operacion === "alta") {
    metrics.prepagoAlta += 1;
  } else if (producto === "prepago" && operacion === "portabilidad") {
    metrics.prepagoPortabilidad += 1;
  }
}

export function sumMetrics(a: PivotMetrics, b: PivotMetrics): PivotMetrics {
  return {
    postpagoAlta: a.postpagoAlta + b.postpagoAlta,
    postpagoPortabilidad: a.postpagoPortabilidad + b.postpagoPortabilidad,
    prepagoAlta: a.prepagoAlta + b.prepagoAlta,
    prepagoPortabilidad: a.prepagoPortabilidad + b.prepagoPortabilidad,
  };
}

export function totalPostpago(m: PivotMetrics) {
  return m.postpagoAlta + m.postpagoPortabilidad;
}

export function totalPrepago(m: PivotMetrics) {
  return m.prepagoAlta + m.prepagoPortabilidad;
}

export function totalGeneral(m: PivotMetrics) {
  return totalPostpago(m) + totalPrepago(m);
}

type NestedPivotMap = Map<string, Map<string, Map<string, PivotMetrics>>>;

function ensureNestedMaps(
  zonalMap: NestedPivotMap,
  zonal: string,
  vendedor: string,
  multimarca: string,
): PivotMetrics {
  if (!zonalMap.has(zonal)) {
    zonalMap.set(zonal, new Map());
  }

  const vendedorMap = zonalMap.get(zonal)!;
  if (!vendedorMap.has(vendedor)) {
    vendedorMap.set(vendedor, new Map());
  }

  const multimarcaMap = vendedorMap.get(vendedor)!;
  if (!multimarcaMap.has(multimarca)) {
    multimarcaMap.set(multimarca, emptyMetrics());
  }

  return multimarcaMap.get(multimarca)!;
}

export function buildPivotTable(
  rows: VentaRow[],
  socioFilter = PIVOT_SOCIO_FILTER,
  accionFilter = PIVOT_ACCION_FILTER,
): PivotTableData {
  const filtered = rows.filter((row) => {
    const matchSocio =
      row.socio.trim().toUpperCase() === socioFilter.toUpperCase();
    const matchAccion =
      row.accion.trim().toUpperCase() === accionFilter.toUpperCase();

    return matchSocio && matchAccion;
  });

  const zonalMap: NestedPivotMap = new Map();

  for (const row of filtered) {
    const zonal = row.zonal.trim() || "Sin zonal";
    const vendedor =
      row.nombreVendedorZonificado.trim() || "Sin vendedor zonificado";
    const multimarca = row.multimarca.trim() || "Sin multimarca";

    const metrics = ensureNestedMaps(zonalMap, zonal, vendedor, multimarca);
    addToMetrics(metrics, row);
  }

  let totalVendedores = 0;
  let totalMultimarcas = 0;

  const groups: PivotZonalGroup[] = [...zonalMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([zonal, vendedorMap]) => {
      const vendedores: PivotVendedorRow[] = [...vendedorMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b, "es"))
        .map(([nombreVendedorZonificado, multimarcaMap]) => {
          const multimarcas: PivotMultimarcaRow[] = [...multimarcaMap.entries()]
            .sort(([a], [b]) => a.localeCompare(b, "es"))
            .map(([multimarca, metrics]) => ({
              id: `${zonal}-${nombreVendedorZonificado}-${multimarca}`,
              multimarca,
              metrics,
            }));

          totalMultimarcas += multimarcas.length;

          const metrics = multimarcas.reduce(
            (acc, item) => sumMetrics(acc, item.metrics),
            emptyMetrics(),
          );

          return {
            id: `${zonal}-${nombreVendedorZonificado}`,
            nombreVendedorZonificado,
            metrics,
            multimarcas,
          };
        });

      totalVendedores += vendedores.length;

      const metrics = vendedores.reduce(
        (acc, vendedor) => sumMetrics(acc, vendedor.metrics),
        emptyMetrics(),
      );

      return { zonal, metrics, vendedores };
    });

  const totals = groups.reduce(
    (acc, group) => sumMetrics(acc, group.metrics),
    emptyMetrics(),
  );

  return {
    groups,
    totals,
    totalRows: filtered.length,
    totalVendedores,
    totalMultimarcas,
    socioFilter,
    accionFilter,
  };
}
