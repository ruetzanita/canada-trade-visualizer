import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const rawDataDir = path.join(process.cwd(), 'raw_data');

const missingCountries = {
  'PH': 'PH',
  'TH': 'TH',
  'BD': 'BD'
};

const aggregateData = {}; 

for (const code of Object.values(missingCountries)) {
  aggregateData[code] = {};
}

function processFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                const countryName = data['Country/Pays'];
                if (missingCountries[countryName]) {
                    const code = missingCountries[countryName];
                    const month = data['YearMonth/AnnéeMois'];
                    const value = parseFloat(data['Value/Valeur']) || 0;
                    const volume = parseFloat(data['Quantity/Quantité']) || 0;
                    
                    if (!aggregateData[code][month]) {
                        aggregateData[code][month] = { value: 0, volume: 0 };
                    }
                    
                    aggregateData[code][month].value += value;
                    aggregateData[code][month].volume += volume;
                }
            })
            .on('end', resolve)
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
            await processFile(fullPath);
        }
    }
}

async function main() {
    await walkDir(rawDataDir);
    
    let sql = `-- Add missing countries to countries table\n`;
    sql += `INSERT INTO countries VALUES('PH','Philippines','Indo-Pacific',1,'2026-06-15 00:00:00');\n`;
    sql += `INSERT INTO countries VALUES('TH','Thailand','Indo-Pacific',1,'2026-06-15 00:00:00');\n`;
    sql += `INSERT INTO countries VALUES('BD','Bangladesh','Indo-Pacific',1,'2026-06-15 00:00:00');\n\n`;
    
    sql += `-- Insert aggregated monthly summaries\n`;
    for (const code of Object.keys(aggregateData)) {
        for (const month of Object.keys(aggregateData[code]).sort()) {
            const { value, volume } = aggregateData[code][month];
            sql += `INSERT INTO macro_monthly_summary VALUES('${month}','${code}',${value},${volume});\n`;
        }
    }
    
    fs.writeFileSync('db/patch_missing_countries.sql', sql);
    console.log('Patch generated at db/patch_missing_countries.sql');
}

main().catch(console.error);
