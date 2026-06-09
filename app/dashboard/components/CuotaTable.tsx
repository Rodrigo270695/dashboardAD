"use client";

import type { CuotaTableData, SemaforoColor } from "@/lib/cuota";
import { cn } from "@/lib/utils";

function formatNum(value: number) {
  return value.toLocaleString("es-PE");
}

function SemaforoBadge({ value, color }: { value: number; color: SemaforoColor }) {
  return (
    <span
      className={cn(
        "semaforo-badge",
        color === "green" && "semaforo-badge--green",
        color === "amber" && "semaforo-badge--amber",
        color === "red" && "semaforo-badge--red",
      )}
    >
      {value}%
    </span>
  );
}

export function CuotaTable({ data }: { data: CuotaTableData }) {
  return (
    <div className="dash-card max-w-full">
      <div className="cuota-scroll overflow-x-auto">
        <table className="cuota-table">
          <thead>
            <tr className="bg-slate-700 text-white">
              <th
                colSpan={1}
                className="border-b border-slate-600 px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide"
              >
                {data.title}
              </th>
              <th
                colSpan={3}
                className="border-b border-slate-600 px-2.5 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide"
              >
                {data.volumenLabel}
              </th>
            </tr>
            <tr className="bg-slate-600 text-[10px] text-slate-100">
              <th className="border-b border-slate-500 px-2.5 py-1 text-left font-medium">
                Vendedores
              </th>
              <th className="border-b border-slate-500 px-2 py-1 text-center font-medium">
                Cuota
              </th>
              <th className="border-b border-slate-500 px-2 py-1 text-center font-medium">
                Corte
              </th>
              <th className="border-b border-slate-500 px-2 py-1 text-center font-medium">
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, index) => (
              <tr
                key={row.nombre}
                className={cn(
                  "transition-colors hover:bg-blue-50/40",
                  index % 2 === 0 ? "bg-white" : "bg-slate-50/60",
                )}
              >
                <td className="border-b border-slate-100 px-2.5 py-1 text-left leading-snug text-slate-700">
                  {row.nombre}
                </td>
                <td className="border-b border-slate-100 px-2 py-1 text-center tabular-nums text-slate-600">
                  {formatNum(row.cuota)}
                </td>
                <td className="border-b border-slate-100 px-2 py-1 text-center tabular-nums text-slate-600">
                  {formatNum(row.corte)}
                </td>
                <td className="border-b border-slate-100 px-2 py-1 text-center">
                  <SemaforoBadge value={row.porcentaje} color={row.semaforo} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-700 text-white">
              <td className="border-t border-slate-600 px-2.5 py-1.5 text-xs font-semibold uppercase">
                {data.totals.nombre}
              </td>
              <td className="border-t border-slate-600 px-2 py-1.5 text-center tabular-nums text-xs font-medium">
                {formatNum(data.totals.cuota)}
              </td>
              <td className="border-t border-slate-600 px-2 py-1.5 text-center tabular-nums text-xs font-medium">
                {formatNum(data.totals.corte)}
              </td>
              <td className="border-t border-slate-600 px-2 py-1.5 text-center">
                <SemaforoBadge
                  value={data.totals.porcentaje}
                  color={data.totals.semaforo}
                />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
