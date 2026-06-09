"use client";

import { useMemo, useState } from "react";

import {
  buildCuotaTable,
  getCuotaAvailableDates,
  parseCuotaSheet,
} from "@/lib/cuota";
import { formatDateLabel } from "@/lib/dates";
import type { VentaRow } from "@/lib/venta";
import { cn } from "@/lib/utils";

import { CuotaTable } from "./CuotaTable";

export function CuotaTablesContainer({
  rows,
  cuotaPrepago,
  cuotaPostpago,
}: {
  rows: VentaRow[];
  cuotaPrepago: string[][];
  cuotaPostpago: string[][];
}) {
  const availableDates = useMemo(() => getCuotaAvailableDates(rows), [rows]);
  const [selectedDates, setSelectedDates] = useState<string[]>(() => [
    ...availableDates,
  ]);

  const prepagoSheet = useMemo(
    () => parseCuotaSheet(cuotaPrepago),
    [cuotaPrepago],
  );
  const postpagoSheet = useMemo(
    () => parseCuotaSheet(cuotaPostpago),
    [cuotaPostpago],
  );

  const prepagoTable = useMemo(
    () => buildCuotaTable(rows, prepagoSheet, selectedDates, "prepago"),
    [rows, prepagoSheet, selectedDates],
  );
  const postpagoTable = useMemo(
    () => buildCuotaTable(rows, postpagoSheet, selectedDates, "postpago"),
    [rows, postpagoSheet, selectedDates],
  );

  function toggleDate(date: string) {
    setSelectedDates((current) => {
      if (current.includes(date)) {
        const next = current.filter((item) => item !== date);
        return next.length > 0 ? next : current;
      }
      return [...current, date].sort();
    });
  }

  function selectAllDates() {
    setSelectedDates([...availableDates]);
  }

  if (availableDates.length === 0) {
    return (
      <div className="dash-card px-4 py-3 text-xs text-amber-800">
        No hay fechas disponibles en Base para MACGA · CHICLAYO · PDV REGULAR.
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="dash-card">
        <div className="dash-card-header">
          <div className="min-w-0">
            <h2 className="dash-card-title leading-tight">
              Cuotas estacionales
              <span className="hidden sm:inline"> — Chiclayo</span>
            </h2>
            <div className="dash-stat-chips">
              <span className="dash-stat-chip">{prepagoTable.socioFilter}</span>
              <span className="dash-stat-chip">{prepagoTable.zonalFilter}</span>
              <span className="dash-stat-chip">
                {selectedDates.length} fecha
                {selectedDates.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={selectAllDates}
            className="dash-btn w-full sm:w-auto"
          >
            Todas las fechas
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 px-3 py-2.5">
          {availableDates.map((date) => {
            const active = selectedDates.includes(date);
            return (
              <button
                key={date}
                type="button"
                onClick={() => toggleDate(date)}
                className={cn("dash-chip", active && "dash-chip--active")}
              >
                {formatDateLabel(date)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <CuotaTable data={prepagoTable} />
        <CuotaTable data={postpagoTable} />
      </div>
    </section>
  );
}
