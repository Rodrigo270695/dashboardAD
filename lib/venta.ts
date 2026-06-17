export interface VentaRow {
  fecha: string;
  dniVendedor: string;
  dniResponsable: string;
  socio: string;
  zonal: string;
  accion: string;
  region: string;
  identificador: string;
  operacion: string;
  producto: string;
  hora: string;
  canalComercial: string;
  codigoPuntoVenta: string;
  nombreVendedorZonificado: string;
  multimarca: string;
}

export function getUniqueSocios(rows: VentaRow[]): string[] {
  const socios = new Set<string>();

  for (const row of rows) {
    const socio = row.socio.trim();
    if (socio) {
      socios.add(socio);
    }
  }

  return [...socios].sort((a, b) => a.localeCompare(b, "es"));
}

export function getDefaultSocio(socios: string[]): string {
  const macga = socios.find((socio) => socio.toUpperCase() === "MACGA");
  return macga ?? socios[0] ?? "MACGA";
}
