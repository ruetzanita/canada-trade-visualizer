import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const rootDir = process.cwd();
const dbPath = path.join(rootDir, 'db', 'production.db');

let currentDb: any = null;
let currentDbMtime = 0;

function getDb() {
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Production database not found at ${dbPath}`);
  }
  const stat = fs.statSync(dbPath);
  if (!currentDb || stat.mtimeMs !== currentDbMtime) {
    if (currentDb) {
      try { currentDb.close(); } catch {}
    }
    currentDb = new Database(dbPath, { readonly: true });
    currentDbMtime = stat.mtimeMs;
  }
  return currentDb;
}

const eudData = JSON.parse(fs.readFileSync(path.join(rootDir, 'db', 'EUD_country_data.json'), 'utf8'));
const ipdData = JSON.parse(fs.readFileSync(path.join(rootDir, 'db', 'IPD_country_data.json'), 'utf8'));
const staticContext = { ...eudData, ...ipdData };

function getMergedContext(db: any) {
  try {
    const rows = db.prepare('SELECT * FROM country_context').all();
    const d1Map: Record<string, any> = {};
    for (const r of rows) {
      d1Map[r.country_name] = {
        historical_background: r.historical_background,
        top_5_commodities: typeof r.top_5_commodities === 'string' ? JSON.parse(r.top_5_commodities) : r.top_5_commodities,
        trade_stance: r.trade_stance,
        deals_and_disruptions: typeof r.deals_and_disruptions === 'string' ? JSON.parse(r.deals_and_disruptions) : r.deals_and_disruptions,
        source_link: r.source_link,
        last_updated_at: r.last_updated_at
      };
    }
    return { ...staticContext, ...d1Map };
  } catch {
    return staticContext;
  }
}

const REST_OF_SA = ["Argentina", "Bolivia", "Colombia", "Ecuador", "Paraguay", "Uruguay", "Venezuela"];

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year') || '2026';
    const regionParam = searchParams.get('region') || 'EUD';
    const year = parseInt(yearParam, 10);
    const prevYear = year - 1;

    // 1. Macro by Country & Month
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

    // 2. Macro by Month
    const monthlyRows = db.prepare(`
      SELECT 
        r.report_month,
        SUM(r.total_export_value_cad) as total_export_value_cad,
        SUM(r.total_export_volume_tonnes) as total_export_volume_tonnes
      FROM macro_monthly_summary r
      LEFT JOIN countries c ON r.country_code = c.country_code
      WHERE c.country_name != 'United States'
        AND SUBSTR(CAST(r.report_month AS TEXT), 1, 4) IN (?, ?)
      GROUP BY r.report_month
      ORDER BY r.report_month ASC
    `).all(year.toString(), prevYear.toString());

    // 3. Global Macro by Month
    const globalMonthlyRows = db.prepare(`
      SELECT 
        r.report_month,
        SUM(r.total_export_value_cad) as total_export_value_cad,
        SUM(r.total_export_volume_tonnes) as total_export_volume_tonnes
      FROM macro_monthly_summary r
      GROUP BY r.report_month
      ORDER BY r.report_month ASC
    `).all();

    // 4. Temporal metadata
    const metaRow = db.prepare(`
      SELECT 
        MIN(report_month) as min_month,
        MAX(report_month) as max_month
      FROM macro_monthly_summary
    `).get();

    const minMonth = metaRow?.min_month ? String(metaRow.min_month) : '202101';
    const maxMonth = metaRow?.max_month ? String(metaRow.max_month) : '202604';
    const minYear = parseInt(minMonth.substring(0, 4), 10);
    const maxYear = parseInt(maxMonth.substring(0, 4), 10);
    const availableYears = [];
    for (let y = minYear; y <= maxYear; y++) {
      availableYears.push(y);
    }
    const metadata = {
      minYear,
      maxYear,
      availableYears,
      latestDataMonth: maxMonth,
      earliestDataMonth: minMonth
    };

    const chartData = monthlyRows.map((r: any) => ({
      month: r.report_month,
      value: Number(r.total_export_value_cad)
    }));

    const globalChartData = globalMonthlyRows.map((r: any) => ({
      month: r.report_month,
      value: Number(r.total_export_value_cad)
    }));

    const countryMap: Record<string, any> = {};

    for (const row of rows) {
      if (!row.country_name) continue;

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
        if (!countryMap[cName].currentMonths.includes(rMonth)) {
          countryMap[cName].currentMonths.push(rMonth);
        }
        countryMap[cName].currentTotal += Number(row.total_export_value_cad);
      } else if (rYear === prevYear) {
        countryMap[cName].prevTotal += Number(row.total_export_value_cad);
      }
    }

    // Collect distinct calendar months present in the selected year across the dataset
    const uniqueCurrentMonths = new Set<string>();
    for (const row of rows) {
      const rMonthStr = String(row.report_month);
      if (rMonthStr.startsWith(year.toString())) {
        uniqueCurrentMonths.add(rMonthStr.substring(4, 6));
      }
    }

    // Determine if requested year is partial (YTD) or a complete 12-month year (YoY)
    const isPartialYear = uniqueCurrentMonths.size > 0 && uniqueCurrentMonths.size < 12;
    const calculationType = isPartialYear ? 'YTD' : 'YoY';

    if (isPartialYear) {
      for (const row of rows) {
        if (!row.country_name) continue;
        let cName = String(row.country_name);
        if (REST_OF_SA.includes(cName)) {
          cName = "Rest of South America";
        }

        const rMonthStr = String(row.report_month);
        const rYear = parseInt(rMonthStr.substring(0, 4), 10);
        const rMonth = rMonthStr.substring(4, 6);

        if (rYear === prevYear && uniqueCurrentMonths.has(rMonth)) {
          if (countryMap[cName]) {
            countryMap[cName].ytdPrevTotal += Number(row.total_export_value_cad);
          }
        }
      }
    }

    const allContext = getMergedContext(db);
    const results = [];

    for (const cName in countryMap) {
      const cmap = countryMap[cName];
      let comparisonValue = calculationType === 'YoY' ? cmap.prevTotal : cmap.ytdPrevTotal;
      let growth = 0;
      if (comparisonValue > 0) {
        growth = ((cmap.currentTotal - comparisonValue) / comparisonValue) * 100;
      }

      const isEUD = Object.keys(eudData).includes(cName);
      const isIPD = Object.keys(ipdData).includes(cName);

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
        context
      });
    }

    return NextResponse.json(
      { success: true, data: results, chartData, globalChartData, metadata },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
