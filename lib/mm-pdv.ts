export interface MmPdvEntry {
  nombreVendedorZonificado: string;
  multimarca: string;
}

export function emptyMmPdvEntry(): MmPdvEntry {
  return {
    nombreVendedorZonificado: "Sin vendedor zonificado",
    multimarca: "Sin multimarca",
  };
}
