"use client";

import Image from "next/image";
import { useActionState } from "react";

import { cn } from "@/lib/utils";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = null;

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden bg-[#0b1630] px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 rounded-full bg-white/5 p-3 ring-1 ring-white/10">
            <Image
              src="/logo.png"
              alt="Macga"
              width={96}
              height={96}
              priority
              className="h-24 w-24 rounded-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Dashboard Macga
          </h1>
          <p className="mt-2 text-sm text-blue-100/80">
            Inicia sesión para ver las estadísticas
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-sm">
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700"
              >
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                disabled={isPending}
                className={cn(
                  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition",
                  "placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
                placeholder="Ingresa tu usuario"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isPending}
                className={cn(
                  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition",
                  "placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
                placeholder="Ingresa tu contraseña"
              />
            </div>

            {state?.error ? (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {state.error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "w-full rounded-xl bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition",
                "hover:from-[#3b82f6] hover:to-[#2563eb] focus:outline-none focus:ring-4 focus:ring-blue-500/30",
                "disabled:cursor-not-allowed disabled:opacity-70",
              )}
            >
              {isPending ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
