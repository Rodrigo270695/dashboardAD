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
console.log("Tabs:", meta.data.sheets?.map((s) => s.properties?.title));

for (const tab of ["Base", "Base MM PDV"]) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID_1,
    range: `'${tab}'!A1:F5`,
  });
  console.log(`\n=== ${tab} ===`);
  console.log("Headers:", res.data.values?.[0]);
  console.log("Row 2:", res.data.values?.[1]);
}
