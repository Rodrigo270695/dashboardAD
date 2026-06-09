"use server";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { validateCredentials } from "@/lib/auth";
import { type SessionData, sessionOptions } from "@/lib/session";

export type LoginState = {
  error?: string;
} | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Completa todos los campos." };
  }

  if (!process.env.AUTH_SECRET) {
    return { error: "Falta configurar AUTH_SECRET en el archivo .env.local." };
  }

  if (!validateCredentials(username, password)) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );
  session.isLoggedIn = true;
  session.username = username;
  await session.save();

  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );
  session.destroy();
  redirect("/login");
}
