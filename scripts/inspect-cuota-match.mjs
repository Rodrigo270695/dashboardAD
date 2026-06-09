import { readFileSync } from "node:fs";
import { google } from "googleapis";

for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, "$1");
}

const json = JSON.parse(readFileSync("google-credentials.json", "utf8"));
const auth = new google.auth.GoogleAuth({
  credentials: json,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });
const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID_1;

const base = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: "Base!A:Z" });
const mm = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: "'Base MM PDV'!A:Z" });
const prepago = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: "'Cuota Prepago'!A:AG" });

const h = base.data.values[0];
const idx = Object.fromEntries(h.map((x, i) => [x, i]));
const mmH = mm.data.values[0];
const mmIdx = Object.fromEntries(mmH.map((x, i) => [x, i]));
const lookup = new Map();
for (const r of mm.data.values.slice(1)) {
  const dni = r[mmIdx.DNI_Responsable ?? mmIdx.DNI_RESPONSABLE];
  const nombre = r[mmIdx.Nombre_Vendedor_Zonificado];
  if (dni && nombre) lookup.set(dni.trim(), nombre.trim());
}

function vendorKey(name) {
  return name.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^(CHI|JAE)\s+/, "").replace(/\s+/g, " ");
}

const chiclayoVendors = new Set();
for (const r of base.data.values.slice(1)) {
  if (r[idx.SOCIO]?.trim().toUpperCase() !== "MACGA") continue;
  if (r[idx.ZONAL]?.trim().toUpperCase() !== "CHICLAYO") continue;
  if (r[idx.ACCION]?.trim() !== "PDV REGULAR") continue;
  chiclayoVendors.add(vendorKey(lookup.get(r[idx.DNI_RESPONSABLE]?.trim()) ?? ""));
}

console.log("Chiclayo vendors from base:", [...chiclayoVendors].sort());

const cuotaVendors = prepago.data.values.slice(1).map((r) => r[0]).filter(Boolean);
console.log("\nCuota vendors:");
for (const v of cuotaVendors) {
  const match = chiclayoVendors.has(vendorKey(v));
  console.log(match ? "OK" : "NO", v, "->", vendorKey(v));
}

const date = "2026-05-29";
const cuotaHeader = "29/05/2026";
const headers = prepago.data.values[0];
const colIdx = headers.indexOf(cuotaHeader);
console.log("\nQuota for", cuotaHeader, "col", colIdx);
for (const r of prepago.data.values.slice(1)) {
  if (!r[0]) continue;
  if (!chiclayoVendors.has(vendorKey(r[0]))) continue;
  console.log(r[0], "cuota:", r[colIdx]);
}
