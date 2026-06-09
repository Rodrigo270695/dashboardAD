import { readFileSync } from "node:fs";
import { google } from "googleapis";
import {
  buildCuotaTable,
  parseCuotaSheet,
  vendorMatchKey,
} from "../lib/cuota.ts";

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

const [baseRes, mmRes, prepagoRes, postpagoRes] = await Promise.all([
  sheets.spreadsheets.values.get({ spreadsheetId: id, range: "Base!A:Z" }),
  sheets.spreadsheets.values.get({ spreadsheetId: id, range: "'Base MM PDV'!A:Z" }),
  sheets.spreadsheets.values.get({ spreadsheetId: id, range: "'Cuota Prepago'!A:AG" }),
  sheets.spreadsheets.values.get({ spreadsheetId: id, range: "'Cuota Postpago'!A:AG" }),
]);

const h = baseRes.data.values[0];
const idx = Object.fromEntries(h.map((x, i) => [x, i]));
const mmH = mmRes.data.values[0];
const mmIdx = Object.fromEntries(mmH.map((x, i) => [x, i]));
const lookup = new Map();
for (const r of mmRes.data.values.slice(1)) {
  const dni = r[mmIdx.DNI_Responsable ?? mmIdx.DNI_RESPONSABLE];
  const nombre = r[mmIdx.Nombre_Vendedor_Zonificado];
  if (dni && nombre) lookup.set(dni.trim(), nombre.trim());
}

const rows = baseRes.data.values.slice(1).map((cells) => ({
  fecha: cells[idx.FECHA]?.trim() ?? "",
  dniVendedor: cells[idx.DNI_VENDEDOR]?.trim() ?? "",
  dniResponsable: cells[idx.DNI_RESPONSABLE]?.trim() ?? "",
  socio: cells[idx.SOCIO]?.trim() ?? "",
  zonal: cells[idx.ZONAL]?.trim() ?? "",
  accion: cells[idx.ACCION]?.trim() ?? "",
  region: cells[idx.REGION]?.trim() ?? "",
  identificador: cells[idx.IDENTIFICADOR]?.trim() ?? "",
  operacion: cells[idx["OPERACIÓN"]]?.trim() ?? "",
  producto: cells[idx.PRODUCTO]?.trim() ?? "",
  hora: cells[idx.HORA]?.trim() ?? "",
  canalComercial: cells[idx["CANAL COMERCIAL"]]?.trim() ?? "",
  codigoPuntoVenta: cells[idx["CODIGO PUNTO DE VENTA"]]?.trim() ?? "",
  nombreVendedorZonificado:
    lookup.get(cells[idx.DNI_RESPONSABLE]?.trim() ?? "") ??
    "Sin vendedor zonificado",
}));

const dates = ["2026-05-29"];
const prepago = buildCuotaTable(
  rows,
  parseCuotaSheet(prepagoRes.data.values ?? []),
  dates,
  "prepago",
);
const postpago = buildCuotaTable(
  rows,
  parseCuotaSheet(postpagoRes.data.values ?? []),
  dates,
  "postpago",
);

console.log("PREPAGO totals:", prepago.totals);
console.log("POSTPAGO totals:", postpago.totals);
console.log("\nPrepago sample:");
for (const row of prepago.rows.slice(0, 5)) {
  console.log(row.nombre, row.cuota, row.corte, row.porcentaje + "%", row.semaforo);
}

console.log("\nVendor keys:", prepago.rows.map((r) => vendorMatchKey(r.nombre)));
