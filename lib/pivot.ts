import type { VentaRow } from "@/lib/venta";

export const PIVOT_SOCIO_FILTER = "MACGA";
export const PIVOT_ACCION_FILTER = "PDV REGULAR";

export interface PivotMetrics {
  postpagoAlta: number;
  postpagoPortabilidad: number;
  prepagoAlta: number;
  prepagoPortabilidad: number;
}

export interface PivotVendedorRow {
  id: string;
  nombreVendedorZonificado: string;
  metrics: PivotMetrics;
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

  const zonalMap = new Map<string, Map<string, PivotMetrics>>();

  for (const row of filtered) {
    const zonal = row.zonal.trim() || "Sin zonal";
    const nombre =
      row.nombreVendedorZonificado.trim() || "Sin vendedor zonificado";

    if (!zonalMap.has(zonal)) {
      zonalMap.set(zonal, new Map());
    }

    const vendedorMap = zonalMap.get(zonal)!;
    if (!vendedorMap.has(nombre)) {
      vendedorMap.set(nombre, emptyMetrics());
    }

    addToMetrics(vendedorMap.get(nombre)!, row);
  }

  let totalVendedores = 0;

  const groups: PivotZonalGroup[] = [...zonalMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([zonal, vendedorMap]) => {
      const vendedores: PivotVendedorRow[] = [...vendedorMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b, "es"))
        .map(([nombreVendedorZonificado, metrics]) => ({
          id: `${zonal}-${nombreVendedorZonificado}`,
          nombreVendedorZonificado,
          metrics,
        }));

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
    socioFilter,
    accionFilter,
  };
}
