import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import Image from "next/image";

import { getServiceAccountEmail } from "@/lib/google-sheets";
import { getUltimaHoraCorte } from "@/lib/hora";
import { fetchDashboardData } from "@/lib/sheet-data";
import { type SessionData, sessionOptions } from "@/lib/session";

import { logoutAction } from "../login/actions";
import { CuotaTablesContainer } from "./components/CuotaTablesContainer";
import { PivotTableContainer } from "./components/PivotTableContainer";

export const revalidate = 300;

export default async function DashboardPage() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );

  let rows = null;
  let cuotaPrepago: string[][] | null = null;
  let cuotaPostpago: string[][] | null = null;
  let error: string | null = null;
  let serviceAccountEmail: string | null = null;
  let ultimaHoraCorte: string | null = null;

  try {
    serviceAccountEmail = getServiceAccountEmail();
    const data = await fetchDashboardData();
    rows = data.rows;
    cuotaPrepago = data.cuotaPrepago;
    cuotaPostpago = data.cuotaPostpago;
    ultimaHoraCorte = getUltimaHoraCorte(rows.map((row) => row.hora));
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "No se pudo conectar con Google Sheets.";
  }

  return (
    <div className="min-h-full bg-[var(--background)]">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Macga"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">
                Dashboard Macga — Cortes de venta
              </p>
              <p className="text-[10px] text-slate-500">
                Bienvenido, {session.username ?? "usuario"}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            {ultimaHoraCorte ? (
              <span
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-800 sm:w-auto"
                title="Última hora registrada en el corte"
              >
                <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                Corte hasta {ultimaHoraCorte}
              </span>
            ) : null}

            <form action={logoutAction} className="w-full shrink-0 sm:w-auto">
              <button type="submit" className="dash-btn w-full sm:w-auto">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 overflow-x-hidden px-3 py-3 sm:px-5 sm:py-4">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <p className="font-semibold">Error al cargar datos</p>
            <p className="mt-1">{error}</p>
            {serviceAccountEmail ? (
              <p className="mt-2 break-all font-mono text-xs">
                {serviceAccountEmail}
              </p>
            ) : null}
          </div>
        ) : null}

        {rows ? <PivotTableContainer rows={rows} /> : null}

        {rows && cuotaPrepago && cuotaPostpago ? (
          <CuotaTablesContainer
            rows={rows}
            cuotaPrepago={cuotaPrepago}
            cuotaPostpago={cuotaPostpago}
          />
        ) : null}
      </main>
    </div>
  );
}
