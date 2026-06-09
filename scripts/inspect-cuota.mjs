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

for (const tab of ["Cuota Prepago", "Cuota Postpago", "Base"]) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: `'${tab}'!A1:AG10`,
  });
  const rows = res.data.values ?? [];
  console.log(`\n=== ${tab} ===`);
  console.log("Headers count:", rows[0]?.length);
  console.log("Headers:", rows[0]?.slice(0, 5), "...", rows[0]?.slice(-3));
  console.log("Row2:", rows[1]?.slice(0, 5));
  console.log("All vendor names:");
  for (const r of rows.slice(1)) {
    if (r[0]) console.log(" -", r[0]);
  }
}

const base = await sheets.spreadsheets.values.get({
  spreadsheetId: id,
  range: "Base!A:Z",
});
const mm = await sheets.spreadsheets.values.get({
  spreadsheetId: id,
  range: "'Base MM PDV'!A:Z",
});

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

const dates = new Set();
const chiclayoVendors = new Map();
for (const r of base.data.values.slice(1)) {
  if (r[idx.SOCIO]?.trim().toUpperCase() !== "MACGA") continue;
  if (r[idx.ZONAL]?.trim().toUpperCase() !== "CHICLAYO") continue;
  if (r[idx.ACCION]?.trim() !== "PDV REGULAR") continue;
  dates.add(r[idx.FECHA]?.trim());
  const nombre = lookup.get(r[idx.DNI_RESPONSABLE]?.trim()) ?? "?";
  const prod = r[idx.PRODUCTO];
  const op = r[idx["OPERACIÓN"]];
  const key = `${nombre}|${prod}|${op}`;
  chiclayoVendors.set(key, (chiclayoVendors.get(key) ?? 0) + 1);
}

console.log("\n=== Base MACGA CHICLAYO ===");
console.log("Dates:", [...dates].sort());
console.log("Vendor product counts sample:", [...chiclayoVendors.entries()].slice(0, 15));
