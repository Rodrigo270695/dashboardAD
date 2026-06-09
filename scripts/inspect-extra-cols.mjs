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
  range: "Hoja 1!N1:Z10",
});
console.log(JSON.stringify(res.data.values, null, 2));

const res2 = await sheets.spreadsheets.values.get({
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID_1,
  range: "Hoja 1!A1:Z1",
});
console.log("All headers A-Z:", res2.data.values?.[0]);
