import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { google } from "googleapis";

for (const line of readFileSync(".env", "utf8").split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (!match) continue;
  process.env[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, "$1");
}

const json = JSON.parse(readFileSync("google-credentials.json", "utf8"));
const auth = new google.auth.GoogleAuth({
  credentials: json,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });
const res = await sheets.spreadsheets.values.get({
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID_1,
  range: process.env.GOOGLE_SHEETS_RANGE_1,
});

const rows = res.data.values?.slice(1) ?? [];
const productos = new Set();
const ops = new Set();
const zonals = new Set();

for (const row of rows) {
  productos.add(row[9]);
  ops.add(row[8]);
  zonals.add(row[4]);
}

console.log("PRODUCTO:", [...productos]);
console.log("OPERACION:", [...ops]);
console.log("ZONAL count:", zonals.size);
console.log("ZONAL sample:", [...zonals].sort().slice(0, 20));
console.log("Sample rows:", rows.slice(0, 3));
