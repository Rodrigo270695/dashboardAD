import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { google } from "googleapis";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    process.env[key.trim()] = rawValue.trim().replace(/^"(.*)"$/, "$1");
  }
}

function getCredentials() {
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;

  if (credentialsPath) {
    const absolutePath = path.isAbsolute(credentialsPath)
      ? credentialsPath
      : path.join(process.cwd(), credentialsPath);

    if (!existsSync(absolutePath)) {
      console.error(`\n❌ Falta el archivo: ${absolutePath}`);
      console.error("\nPasos:");
      console.error("1. Google Cloud → Credenciales → dashboard-sheets → Claves → JSON");
      console.error("2. Guarda el archivo como google-credentials.json en la raíz del proyecto");
      console.error("3. En .env.local: GOOGLE_CREDENTIALS_PATH=./google-credentials.json\n");
      process.exit(1);
    }

    const json = JSON.parse(readFileSync(absolutePath, "utf8"));
    return {
      client_email: json.client_email,
      private_key: json.private_key,
    };
  }

  return {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

const credentials = getCredentials();

if (!credentials.client_email || !credentials.private_key) {
  console.error("\n❌ Faltan credenciales de Google.\n");
  process.exit(1);
}

console.log(`Cuenta: ${credentials.client_email}`);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

try {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID_1,
    range: process.env.GOOGLE_SHEETS_RANGE_1 ?? "Base!A:Z",
  });

  const rows = res.data.values ?? [];
  console.log(`✅ Conexión OK — ${rows.length} filas (incluye encabezado)`);
  console.log("Encabezados:", rows[0]?.join(" | "));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n❌ Error: ${message}\n`);

  if (message.includes("account not found")) {
    console.error("→ Descarga un JSON NUEVO en Google Cloud (Claves → Agregar clave → JSON)");
  }

  if (message.includes("403") || message.includes("permission")) {
    console.error(`→ Comparte la hoja con: ${credentials.client_email}`);
  }

  process.exit(1);
}
