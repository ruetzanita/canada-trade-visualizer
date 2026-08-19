import EUD_data from '../../db/EUD_country_data';
import IPD_data from '../../db/IPD_country_data';

const REST_OF_SA = ["Argentina", "Bolivia", "Colombia", "Ecuador", "Paraguay", "Uruguay", "Venezuela"];

const EU_COUNTRIES = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", 
  "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia", 
  "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania", 
  "Slovakia", "Slovenia", "Spain", "Sweden"
];

const EFTA_COUNTRIES = ["Iceland", "Liechtenstein", "Norway", "Switzerland"];

// Extracted DB queries
async function executeQuery(db: any, sql: string, args: any[] = []) {
  const stmt = db.prepare(sql);
  const result = args.length > 0 ? await stmt.bind(...args).all() : await stmt.all();
  if (Array.isArray(result?.results)) return result.results;
  if (Array.isArray(result)) return result;
  return [];
}

async function getMacroValueByMonth(db: any, year: number, prevYear: number) {
  return await executeQuery(db, `
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
  `, [year.toString(), prevYear.toString()]);
}

async function getMacroValueByCountryAndMonth(db: any, year: number, prevYear: number) {
  return await executeQuery(db, `
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
  `, [year.toString(), prevYear.toString()]);
}

async function getGlobalMacroValueByMonth(db: any) {
  return await executeQuery(db, `
    SELECT 
      r.report_month,
      SUM(r.total_export_value_cad) as total_export_value_cad,
      SUM(r.total_export_volume_tonnes) as total_export_volume_tonnes
    FROM macro_monthly_summary r
    GROUP BY r.report_month
    ORDER BY r.report_month ASC
  `);
}

export async function onRequest(context: any) {
  const { request, env } = context;

  try {
    const d1Db = env.DB;
    if (!d1Db) {
      return new Response(JSON.stringify({ success: false, error: "Cloudflare D1 Database binding 'DB' not found in environment context!" }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year') || new Date().getFullYear().toString();
    const regionParam = searchParams.get('region') || 'EUD';
    const year = parseInt(yearParam, 10);
    const prevYear = year - 1;

    // Load qualitative data from static imports
    const eudData: Record<string, any> = EUD_data || {};
    const ipdData: Record<string, any> = IPD_data || {};
    const allContext = { ...eudData, ...ipdData } as any;

    // Fetch from DB using helper
    const [rows, monthlyRows, globalMonthlyRows] = await Promise.all([
      getMacroValueByCountryAndMonth(d1Db, year, prevYear),
      getMacroValueByMonth(d1Db, year, prevYear),
      getGlobalMacroValueByMonth(d1Db)
    ]);

    const chartData = monthlyRows.map((r: any) => ({
      month: r.report_month,
      value: Number(r.total_export_value_cad)
    }));

    const globalChartData = globalMonthlyRows.map((r: any) => ({
      month: r.report_month,
      value: Number(r.total_export_value_cad)
    }));

    const countryMap: Record<string, {
      country_name: string;
      country_code: string;
      currentMonths: string[];
      currentTotal: number;
      prevTotal: number;
      ytdPrevTotal: number;
    }> = {};

    // First pass: collect current year data and months
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
        countryMap[cName].currentMonths.push(rMonth);
        countryMap[cName].currentTotal += Number(row.total_export_value_cad);
      } else if (rYear === prevYear) {
        countryMap[cName].prevTotal += Number(row.total_export_value_cad);
      }
    }

    // Second pass: for YTD, we need prev year values only for matching months
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
      let comparisonValue = 0;

      if (calculationType === 'YoY') {
        comparisonValue = cmap.prevTotal;
      } else {
        comparisonValue = cmap.ytdPrevTotal;
      }

      let growth = 0;
      if (comparisonValue > 0) {
        growth = ((cmap.currentTotal - comparisonValue) / comparisonValue) * 100;
      }

      // Context mapping
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

    return new Response(JSON.stringify({ success: true, data: results, chartData, globalChartData }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error && error.message ? error.message : "Unknown Cloudflare Pages Function error"
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
