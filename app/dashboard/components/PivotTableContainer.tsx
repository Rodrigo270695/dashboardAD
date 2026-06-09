"use client";

import { useMemo, useState } from "react";

import { buildPivotTable } from "@/lib/pivot";
import {
  getDefaultSocio,
  getUniqueSocios,
  type VentaRow,
} from "@/lib/venta";

import { PivotTable } from "./PivotTable";

export function PivotTableContainer({ rows }: { rows: VentaRow[] }) {
  const socios = useMemo(() => getUniqueSocios(rows), [rows]);
  const [selectedSocio, setSelectedSocio] = useState(() =>
    getDefaultSocio(socios),
  );

  const pivot = useMemo(
    () => buildPivotTable(rows, selectedSocio),
    [rows, selectedSocio],
  );

  return (
    <PivotTable
      key={selectedSocio}
      data={pivot}
      socios={socios}
      selectedSocio={selectedSocio}
      onSocioChange={setSelectedSocio}
    />
  );
}
