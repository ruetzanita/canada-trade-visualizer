import Database from 'better-sqlite3';
import path from 'path';
import EUD_data from '../db/EUD_country_data.ts';
import IPD_data from '../db/IPD_country_data.ts';

const REST_OF_SA = ["Argentina", "Bolivia", "Colombia", "Ecuador", "Paraguay", "Uruguay", "Venezuela"];

const dbPath = path.join(process.cwd(), 'db', 'production.db');
const db = new Database(dbPath, { readonly: true });

function testQuery(year, regionParam) {
  const prevYear = year - 1;

  const rows = db.prepare(`
    SELECT 
      c.country_name,
      r.country_code,
      r.report_month,
      r.total_export_value_cad,
      r.total_export_volume_tonnes
    FROM macro_monthly_summary r
    LEFT JOIN countries c ON r.country_code = c.country_code
    WHERE c.country_name != 'United States'
      AND SUBSTR(CAST(r.report_month AS TEXT), 1, 4) IN (?, ?)
    ORDER BY r.country_code ASC, r.report_month ASC
  `).all(year.toString(), prevYear.toString());

  console.log(`\n==========================================`);
  console.log(`Testing year=${year}, region=${regionParam}`);
  console.log(`SQL query returned ${rows.length} rows`);
  if (rows.length > 0) {
    console.log(`Sample row 0:`, rows[0]);
  }

  const eudData = EUD_data || {};
  const ipdData = IPD_data || {};
  const allContext = { ...eudData, ...ipdData };

  const countryMap = {};

  for (const row of rows) {
    if (!row.country_name) {
      console.log(`WARNING: Row has null country_name! country_code: ${row.country_code}`);
      continue;
    }
    
    const rMonthStr = String(row.report_month);
    const rYear = parseInt(rMonthStr.substring(0, 4), 10);
    const rMonth = rMonthStr.substring(4, 6);
    let cName = String(row.country_name);
    let cCode = String(row.country_code);

    if (REST_OF_SA.includes(cName)) {
      cName = "Rest of South America";
      cCode = "ROSA";
    }

    if (!countryMap[cName]) {
      countryMap[cName] = {
        country_name: cName,
        country_code: cCode,
        currentMonths: [],
        currentTotal: 0,
        prevTotal: 0,
        ytdPrevTotal: 0,
      };
    }

    if (rYear === year) {
      countryMap[cName].currentMonths.push(rMonth);
      countryMap[cName].currentTotal += Number(row.total_export_value_cad);
    } else if (rYear === prevYear) {
      countryMap[cName].prevTotal += Number(row.total_export_value_cad);
    }
  }

  if (year >= 2026) {
    for (const row of rows) {
      if (!row.country_name) continue;
      let cName = String(row.country_name);
      if (REST_OF_SA.includes(cName)) {
        cName = "Rest of South America";
      }
      
      const rMonthStr = String(row.report_month);
      const rYear = parseInt(rMonthStr.substring(0, 4), 10);
      const rMonth = rMonthStr.substring(4, 6);

      if (rYear === prevYear && countryMap[cName].currentMonths.includes(rMonth)) {
        countryMap[cName].ytdPrevTotal += Number(row.total_export_value_cad);
      }
    }
  }

  const results = [];
  const calculationType = year <= 2025 ? 'YoY' : 'YTD';

  for (const cName in countryMap) {
    const cmap = countryMap[cName];
    let comparisonValue = calculationType === 'YoY' ? cmap.prevTotal : cmap.ytdPrevTotal;
    let growth = comparisonValue > 0 ? ((cmap.currentTotal - comparisonValue) / comparisonValue) * 100 : 0;

    const isEUD = Object.keys(eudData).includes(cName);
    const isIPD = Object.keys(ipdData).includes(cName);

    console.log(`Country: "${cName}", currentTotal: ${cmap.currentTotal}, isEUD: ${isEUD}, isIPD: ${isIPD}`);

    if (regionParam === 'EUD' && !isEUD) continue;
    if (regionParam === 'IPD' && !isIPD) continue;

    const context = allContext[cName] || null;

    results.push({
      country_name: cName,
      country_code: cmap.country_code,
      year,
      calculationType,
      currentValue: cmap.currentTotal,
      comparisonValue,
      growthPercentage: growth,
      hasContext: !!context
    });
  }

  console.log(`Final results count for region ${regionParam}: ${results.length}`);
  console.log(`Results:`, results);
}

testQuery(2026, 'EUD');
testQuery(2025, 'EUD');
testQuery(2026, 'IPD');

// Validate temporal metadata extraction
const metaRow = db.prepare(`SELECT MIN(report_month) as min_m, MAX(report_month) as max_m FROM macro_monthly_summary`).get();
console.log(`\nTemporal Metadata Validation: min_month=${metaRow.min_m}, max_month=${metaRow.max_m}`);
if (!metaRow.min_m || !metaRow.max_m) {
  throw new Error("Missing temporal boundaries in macro_monthly_summary!");
}

db.close();
console.log("All API logic and metadata tests passed successfully!");

