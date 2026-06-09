import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { google } from "googleapis";

interface ServiceAccountJson {
  client_email: string;
  private_key: string;
}

function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, "\n");
}

function loadFromJsonFile(filePath: string): ServiceAccountJson {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  if (!existsSync(absolutePath)) {
    throw new Error(
      `No se encontró el archivo de credenciales: ${absolutePath}`,
    );
  }

  const json = JSON.parse(readFileSync(absolutePath, "utf8")) as ServiceAccountJson;

  if (!json.client_email || !json.private_key) {
    throw new Error(
      "El JSON no tiene client_email o private_key. Descarga de nuevo la clave en Google Cloud.",
    );
  }

  return {
    client_email: json.client_email,
    private_key: normalizePrivateKey(json.private_key),
  };
}

function getCredentials(): ServiceAccountJson {
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;

  if (credentialsPath) {
    return loadFromJsonFile(credentialsPath);
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ? normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY)
    : undefined;

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Configura GOOGLE_CREDENTIALS_PATH apuntando al JSON descargado, o define GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY en .env.local",
    );
  }

  return { client_email: clientEmail, private_key: privateKey };
}

export function getServiceAccountEmail(): string {
  return getCredentials().client_email;
}

export async function getSheetValues(
  range: string,
  spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID_1,
): Promise<string[][]> {
  if (!spreadsheetId) {
    throw new Error("Falta GOOGLE_SHEETS_SPREADSHEET_ID_1 en .env");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return (response.data.values as string[][]) ?? [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("account not found")) {
      throw new Error(
        "La cuenta de servicio no es válida. Descarga un JSON nuevo en Google Cloud, guárdalo como google-credentials.json y define GOOGLE_CREDENTIALS_PATH=./google-credentials.json en .env.local",
      );
    }

    if (message.includes("Unable to parse range")) {
      throw new Error(
        `La pestaña del rango no existe. Revisa GOOGLE_SHEETS_RANGE_1 en .env (ej: "Hoja 1!A:M"). Error: ${message}`,
      );
    }

    if (message.includes("permission") || message.includes("403")) {
      const email = getCredentials().client_email;
      throw new Error(
        `Sin permiso para leer la hoja. Compártela con este email exacto como Lector: ${email}`,
      );
    }

    throw error;
  }
}
