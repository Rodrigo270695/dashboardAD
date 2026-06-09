"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  type PivotMetrics,
  type PivotTableData,
  totalGeneral,
  totalPostpago,
  totalPrepago,
} from "@/lib/pivot";
import { cn } from "@/lib/utils";

function formatNum(value: number) {
  return value.toLocaleString("es-PE");
}

function ColGroup() {
  return (
    <colgroup>
      <col className="pivot-col-label" />
      <col className="pivot-col-metric" />
      <col className="pivot-col-metric" />
      <col className="pivot-col-metric-wide" />
      <col className="pivot-col-metric" />
      <col className="pivot-col-metric" />
      <col className="pivot-col-metric-wide" />
      <col className="pivot-col-metric-wide" />
    </colgroup>
  );
}

function MetricsCells({
  metrics,
  variant = "zonal",
}: {
  metrics: PivotMetrics;
  variant?: "zonal" | "vendor" | "total";
}) {
  const cell = cn(
    "border-b border-slate-200/80 px-1.5 py-1 text-right tabular-nums",
    variant === "zonal" && "text-slate-700",
    variant === "vendor" && "text-slate-500",
    variant === "total" && "border-slate-600/50 text-white",
  );

  return (
    <>
      <td className={cell}>{formatNum(metrics.postpagoAlta)}</td>
      <td className={cell}>{formatNum(metrics.postpagoPortabilidad)}</td>
      <td className={cn(cell, "font-medium")}>
        {formatNum(totalPostpago(metrics))}
      </td>
      <td className={cell}>{formatNum(metrics.prepagoAlta)}</td>
      <td className={cell}>{formatNum(metrics.prepagoPortabilidad)}</td>
      <td className={cn(cell, "font-medium")}>
        {formatNum(totalPrepago(metrics))}
      </td>
      <td className={cn(cell, "font-semibold")}>
        {formatNum(totalGeneral(metrics))}
      </td>
    </>
  );
}

export function PivotTable({
  data,
  socios,
  selectedSocio,
  onSocioChange,
}: {
  data: PivotTableData;
  socios?: string[];
  selectedSocio?: string;
  onSocioChange?: (socio: string) => void;
}) {
  const allZonals = useMemo(
    () => data.groups.map((group) => group.zonal),
    [data.groups],
  );
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  function toggleZonal(zonal: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(zonal)) {
        next.delete(zonal);
      } else {
        next.add(zonal);
      }
      return next;
    });
  }

  function expandAll() {
    setExpanded(new Set(allZonals));
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  return (
    <div className="dash-card max-w-full">
      <div className="dash-card-header">
        <div className="min-w-0">
          <h2 className="dash-card-title leading-tight">
            Tabla dinámica
            <span className="hidden font-normal text-slate-500 sm:inline">
              {" "}
              — Suma de registros
            </span>
          </h2>
          <div className="dash-stat-chips">
            <span className="dash-stat-chip">{data.accionFilter}</span>
            <span className="dash-stat-chip">
              {data.totalRows.toLocaleString("es-PE")} reg.
            </span>
            <span className="dash-stat-chip">{data.groups.length} zonales</span>
            <span className="dash-stat-chip">
              {data.totalVendedores} vendedores
            </span>
          </div>
        </div>

        <div className="dash-toolbar">
          {socios && selectedSocio && onSocioChange ? (
            <select
              value={selectedSocio}
              onChange={(event) => onSocioChange(event.target.value)}
              aria-label="Filtrar por socio"
              className="dash-select w-full sm:w-auto"
            >
              {socios.map((socio) => (
                <option key={socio} value={socio}>
                  {socio}
                </option>
              ))}
            </select>
          ) : (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-center text-[10px] font-medium text-blue-700">
              {data.socioFilter}
            </span>
          )}

          <div className="dash-toolbar-actions">
            <button type="button" onClick={expandAll} className="dash-btn">
              <span className="sm:hidden">Expandir</span>
              <span className="hidden sm:inline">Expandir todo</span>
            </button>
            <button type="button" onClick={collapseAll} className="dash-btn">
              <span className="sm:hidden">Contraer</span>
              <span className="hidden sm:inline">Contraer todo</span>
            </button>
          </div>
        </div>
      </div>

      <p className="border-b border-slate-100 bg-slate-50/80 px-3 py-1 text-[10px] text-slate-400 lg:hidden">
        Desliza horizontalmente para ver todas las columnas →
      </p>

      <div className="pivot-scroll max-w-full overflow-x-auto overscroll-x-contain">
        <table className="pivot-table">
          <ColGroup />
          <thead>
            <tr className="bg-slate-700 text-white">
              <th
                rowSpan={2}
                className="pivot-sticky-col border-b border-slate-600 px-2 py-1.5 text-left font-medium"
              >
                Etiquetas de fila
                <span className="mt-0.5 block text-[9px] font-normal text-slate-300">
                  ZONAL / Vendedor
                </span>
              </th>
              <th
                colSpan={3}
                className="border-b border-slate-600 px-1 py-1.5 text-center font-medium"
              >
                Postpago
              </th>
              <th
                colSpan={3}
                className="border-b border-slate-600 px-1 py-1.5 text-center font-medium"
              >
                Prepago
              </th>
              <th
                rowSpan={2}
                className="border-b border-slate-600 px-1 py-1.5 text-center font-medium"
              >
                Total
              </th>
            </tr>
            <tr className="bg-slate-600 text-[10px] text-slate-100">
              {(
                [
                  { key: "postpago-alta", label: "Alta" },
                  { key: "postpago-port", label: "Port." },
                  { key: "postpago-total", label: "Total" },
                  { key: "prepago-alta", label: "Alta" },
                  { key: "prepago-port", label: "Port." },
                  { key: "prepago-total", label: "Total" },
                ] as const
              ).map(({ key, label }) => (
                <th
                  key={key}
                  className="border-b border-slate-500 px-1 py-1 text-center font-normal"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.groups.map((group) => {
              const isExpanded = expanded.has(group.zonal);

              return (
                <Fragment key={group.zonal}>
                  <tr className="group/zonal bg-slate-50">
                    <td className="pivot-sticky-col border-b border-slate-200/80 bg-slate-50 p-0 group-hover/zonal:bg-[var(--dash-row-hover)]">
                      <button
                        type="button"
                        onClick={() => toggleZonal(group.zonal)}
                        className="flex w-full cursor-pointer items-center gap-1 px-2 py-1.5 text-left font-medium text-slate-800 transition-colors hover:bg-[var(--dash-row-hover)]"
                      >
                        <ChevronDown
                          className={cn(
                            "h-3 w-3 shrink-0 text-blue-600 transition-transform duration-200",
                            isExpanded ? "rotate-0" : "-rotate-90",
                          )}
                        />
                        <span className="leading-tight">{group.zonal}</span>
                      </button>
                    </td>
                    <MetricsCells metrics={group.metrics} variant="zonal" />
                  </tr>

                  {group.vendedores.map((vendedor) => (
                    <tr
                      key={vendedor.id}
                      className={cn(
                        "pivot-vendor-row bg-white hover:bg-slate-50/80",
                        isExpanded
                          ? "pivot-vendor-row--open"
                          : "pivot-vendor-row--closed",
                      )}
                      aria-hidden={!isExpanded}
                    >
                      <td className="pivot-sticky-col border-b border-slate-100 bg-white px-2 py-1 pl-5 text-[10px] leading-snug text-slate-600">
                        {vendedor.nombreVendedorZonificado}
                      </td>
                      <MetricsCells
                        metrics={vendedor.metrics}
                        variant="vendor"
                      />
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-slate-700 text-white">
              <td className="pivot-sticky-col border-t border-slate-600 bg-slate-700 px-2 py-1.5 text-xs font-semibold">
                Total general
              </td>
              <MetricsCells metrics={data.totals} variant="total" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
