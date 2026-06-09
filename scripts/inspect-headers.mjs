import { readFileSync } from "node:fs";
import { google } from "googleapis";

for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, "$1");
}

const json = JSON.parse(readFileSync("google-credentials.json", "utf8"));
const auth = new google.auth.GoogleAuth({ credentials: json, scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
const sheets = google.sheets({ version: "v4", auth });

const meta = await sheets.spreadsheets.get({
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID_1,
});
console.log("Sheets:", meta.data.sheets?.map((s) => s.properties?.title));

const res = await sheets.spreadsheets.values.get({
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID_1,
  range: "Hoja 1!A1:ZZ5",
});

const headers = res.data.values?.[0] ?? [];
console.log("Headers:", headers.map((h, i) => `${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i/26) : ""}: ${h}`));
console.log("Row 2:", res.data.values?.[1]);
