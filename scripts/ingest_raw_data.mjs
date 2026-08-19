import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import Database from 'better-sqlite3';

const rawDataDir = path.join(process.cwd(), 'raw_data');
const dbPath = path.join(process.cwd(), 'db', 'unified_master.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = OFF');

// Fetch valid country codes
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
        const BATCH_SIZE = 5000;
        
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
                        batch = [];
                    }
                }
            })
            .on('end', () => {
                if (batch.length > 0) {
                    insertBatch(batch);
                }
                resolve();
            })
            .on('error', reject);
    });
}

async function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            await walkDir(fullPath);
        } else if (file.startsWith('ODPF') && file.endsWith('.csv')) {
            console.log(`Processing ${fullPath}...`);
            await processFile(fullPath);
        }
    }
}

async function main() {
    console.log('Starting ingestion...');
    await walkDir(rawDataDir);
    console.log('Ingestion complete!');
    db.close();
}

main().catch(console.error);
