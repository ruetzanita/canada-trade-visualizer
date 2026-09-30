import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import Database from 'better-sqlite3';

const rawDataDir = path.join(process.cwd(), 'raw_data');
const dbPath = path.join(process.cwd(), 'db', 'unified_master.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = OFF');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// 1. Ensure all tracked partner countries exist in countries table
const ensureCountriesStmt = db.prepare(`
    INSERT OR IGNORE INTO countries (country_code, country_name, region, is_active_agreement)
    VALUES (?, ?, ?, 1)
`);
ensureCountriesStmt.run('PH', 'Philippines', 'Indo-Pacific');
ensureCountriesStmt.run('TH', 'Thailand', 'Indo-Pacific');
ensureCountriesStmt.run('BD', 'Bangladesh', 'Indo-Pacific');

// 2. Fetch valid country codes
const validCountries = new Set();
const rows = db.prepare('SELECT country_code FROM countries').all();
for (const row of rows) {
    validCountries.add(row.country_code);
}

const insertStmt = db.prepare(`
    INSERT INTO raw_trade_data (
        report_month,
        commodity_code,
        country_code,
        export_value_cad,
        export_volume_tonnes,
        cargo_type
    ) VALUES (?, ?, ?, ?, ?, ?)
`);

function processFile(filePath) {
    return new Promise((resolve, reject) => {
        let batch = [];
        const BATCH_SIZE = 10000;
        let insertedRows = 0;
        
        const insertBatch = db.transaction((records) => {
            for (const record of records) {
                insertStmt.run(record);
            }
        });

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                const country = data['Country/Pays'];
                if (validCountries.has(country)) {
                    batch.push([
                        data['YearMonth/AnnéeMois'],
                        data['HS8'],
                        country,
                        data['Value/Valeur'],
                        data['Quantity/Quantité'] || 0,
                        'TEU'
                    ]);
                    
                    if (batch.length >= BATCH_SIZE) {
                        insertBatch(batch);
                        insertedRows += batch.length;
                        batch = [];
                    }
                }
            })
            .on('end', () => {
                if (batch.length > 0) {
                    insertBatch(batch);
                    insertedRows += batch.length;
                }
                console.log(`   -> Ingested ${insertedRows.toLocaleString()} tracked rows from ${path.basename(filePath)}`);
                resolve();
            })
            .on('error', reject);
    });
}

async function walkDir(dir, targetYear) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (!targetYear || file.includes(String(targetYear))) {
                await walkDir(fullPath, targetYear);
            }
        } else if (file.startsWith('ODPFN016') && file.endsWith('.csv')) {
            // Only ingest ODPFN016 (HS8 detailed commodity exports) to avoid triple-counting
            if (!targetYear || file.includes(String(targetYear))) {
                console.log(`Processing ${fullPath}...`);
                await processFile(fullPath);
            }
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    const yearArg = args.find(a => a.startsWith('--year='));
    const isAll = args.includes('--all') || (!yearArg && !args.includes('--year=2026'));
    const targetYear = yearArg ? yearArg.split('=')[1] : (isAll ? null : '2026');

    console.log(`Starting ingestion${targetYear ? ` for year ${targetYear}` : ' for ALL years (2021-2026)'}...`);

    if (!targetYear) {
        console.log("Dropping secondary indexes on raw_trade_data for high-speed bulk ingestion...");
        db.exec("DROP INDEX IF EXISTS idx_raw_trade_data_country_month;");
        db.exec("DROP INDEX IF EXISTS idx_raw_trade_data_code;");

        console.log("Purging all records from raw_trade_data and macro_monthly_summary...");
        db.prepare("DELETE FROM raw_trade_data").run();
        db.prepare("DELETE FROM macro_monthly_summary").run();
    } else {
        console.log(`Purging ${targetYear} records from raw_trade_data and macro_monthly_summary...`);
        db.prepare(`DELETE FROM raw_trade_data WHERE report_month LIKE '${targetYear}%'`).run();
        db.prepare(`DELETE FROM macro_monthly_summary WHERE report_month LIKE '${targetYear}%'`).run();
    }

    await walkDir(rawDataDir, targetYear);

    if (!targetYear) {
        console.log("Rebuilding indexes on raw_trade_data...");
        db.exec("CREATE INDEX IF NOT EXISTS idx_raw_trade_data_country_month ON raw_trade_data(country_code, report_month);");
        db.exec("CREATE INDEX IF NOT EXISTS idx_raw_trade_data_code ON raw_trade_data(commodity_code);");

        console.log("Recomputing macro_monthly_summary for ALL years...");
        const recomputeResult = db.prepare(`
            INSERT INTO macro_monthly_summary (report_month, country_code, total_export_value_cad, total_export_volume_tonnes)
            SELECT report_month, country_code, SUM(export_value_cad), SUM(export_volume_tonnes)
            FROM raw_trade_data
            GROUP BY report_month, country_code
        `).run();
        console.log(`Created ${recomputeResult.changes.toLocaleString()} rows in macro_monthly_summary.`);
    } else {
        console.log(`Recomputing macro_monthly_summary for ${targetYear}...`);
        const recomputeResult = db.prepare(`
            INSERT INTO macro_monthly_summary (report_month, country_code, total_export_value_cad, total_export_volume_tonnes)
            SELECT report_month, country_code, SUM(export_value_cad), SUM(export_volume_tonnes)
            FROM raw_trade_data
            WHERE report_month LIKE '${targetYear}%'
            GROUP BY report_month, country_code
        `).run();
        console.log(`Created ${recomputeResult.changes.toLocaleString()} rows in macro_monthly_summary for ${targetYear}.`);
    }

    const summaryStats = db.prepare(`
        SELECT 
            MIN(report_month) as min_month, 
            MAX(report_month) as max_month, 
            COUNT(DISTINCT report_month) as distinct_months,
            COUNT(*) as total_rows
        FROM macro_monthly_summary
    `).get();

    console.log("\nIngestion complete!");
    console.log("Updated macro_monthly_summary status:", summaryStats);

    db.close();
}

main().catch((err) => {
    console.error("Ingestion failed:", err);
    process.exit(1);
});
