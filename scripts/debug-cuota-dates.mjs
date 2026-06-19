import { readFileSync } from "node:fs";
import { google } from "googleapis";

for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, "$1");
}

function parseCuotaDateHeader(header) {
  const match = String(header).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeBaseFecha(fecha) {
  const trimmed = String(fecha).trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const fromDmy = parseCuotaDateHeader(trimmed);
  if (fromDmy) return fromDmy;
  return trimmed;
}

const json = JSON.parse(readFileSync("google-credentials.json", "utf8"));
const auth = new google.auth.GoogleAuth({
  credentials: json,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });
const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID_1;

const [prepago, base] = await Promise.all([
  sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: "'Cuota Prepago'!A1:AG5",
  }),
  sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: "Base!A:Z",
  }),
]);

const h = base.data.values[0];
const idx = Object.fromEntries(h.map((x, i) => [x, i]));
const baseDateRaw = [...base.data.values.slice(1)]
  .find((r) =>
    r[idx.SOCIO]?.trim().toUpperCase() === "MACGA" &&
    r[idx.ZONAL]?.trim().toUpperCase() === "CHICLAYO",
  )?.[idx.FECHA];

const isoDate = normalizeBaseFecha(baseDateRaw);
console.log("Base FECHA raw:", baseDateRaw, "-> ISO:", isoDate);

const headers = prepago.data.values[0];
const colIdx = headers.findIndex((x) => normalizeBaseFecha(x) === isoDate || parseCuotaDateHeader(x) === isoDate);
console.log("Matching cuota col:", colIdx, headers[colIdx]);
console.log("Quota value:", prepago.data.values[1]?.[colIdx]);
