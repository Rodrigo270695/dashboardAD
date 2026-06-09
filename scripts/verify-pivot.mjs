import { readFileSync } from "node:fs";
import { google } from "googleapis";

for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, "$1");
}

const json = JSON.parse(readFileSync("google-credentials.json", "utf8"));
const auth = new google.auth.GoogleAuth({ credentials: json, scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
const sheets = google.sheets({ version: "v4", auth });
const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID_1;

const base = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: "Base!A:Z" });
const h = base.data.values[0];
const idx = Object.fromEntries(h.map((x, i) => [x, i]));

const macga = base.data.values.slice(1).filter((r) => r[idx.SOCIO]?.trim().toUpperCase() === "MACGA");
const acciones = new Map();
const combos = { pa: 0, pp: 0, ra: 0, rp: 0 };

for (const r of macga) {
  const acc = r[idx.ACCION]?.trim();
  acciones.set(acc, (acciones.get(acc) ?? 0) + 1);
  if (acc !== "PDV REGULAR") continue;
  const prod = r[idx.PRODUCTO];
  const op = r[idx["OPERACIÓN"]];
  if (prod === "Postpago" && op === "Alta") combos.pa++;
  if (prod === "Postpago" && op === "Portabilidad") combos.pp++;
  if (prod === "Prepago" && op === "Alta") combos.ra++;
  if (prod === "Prepago" && op === "Portabilidad") combos.rp++;
}

console.log("MACGA acciones:", [...acciones.entries()]);
console.log("PDV REGULAR combos:", combos, "total", combos.pa + combos.pp + combos.ra + combos.rp);
