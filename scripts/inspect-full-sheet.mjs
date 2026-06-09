import { readFileSync } from "node:fs";
import { google } from "googleapis";

for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, "$1");
}

const json = JSON.parse(readFileSync("google-credentials.json", "utf8"));
const auth = new google.auth.GoogleAuth({ credentials: json, scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
const sheets = google.sheets({ version: "v4", auth });

const res = await sheets.spreadsheets.values.get({
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID_1,
  range: "Hoja 1",
});

const values = res.data.values ?? [];
console.log("Total columns in widest row:", Math.max(...values.map((r) => r.length)));
console.log("Headers:", values[0]);
console.log("Rows with >13 cols:", values.filter((r) => r.length > 13).length);

// Check other sheets in spreadsheet
const meta = await sheets.spreadsheets.get({
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID_1,
  includeGridData: false,
});
for (const s of meta.data.sheets ?? []) {
  console.log("Tab:", s.properties?.title, "cols:", s.properties?.gridProperties?.columnCount);
}
