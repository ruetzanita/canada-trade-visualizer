import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const sourceDbPath = path.resolve('db/unified_master.db');
const destDbPath = path.resolve('db/production.db');

if (fs.existsSync(destDbPath)) {
    fs.unlinkSync(destDbPath);
}

const destDb = new Database(destDbPath);

try {
    destDb.exec(`ATTACH DATABASE '${sourceDbPath}' AS source;`);

    // Read schemas
    const sourceDb = new Database(sourceDbPath, { readonly: true });
    
    const tables = ['countries', 'macro_monthly_summary', 'country_context', 'weekly_digests'];
    
    for (const table of tables) {
        // Get table schema
        const tableSchema = sourceDb.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`).get(table);
        if (tableSchema && tableSchema.sql) {
            destDb.exec(tableSchema.sql);
            
            // Get index schemas for the table
            const indexes = sourceDb.prepare(`SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name=? AND sql IS NOT NULL`).all(table);
            for (const index of indexes) {
                destDb.exec(index.sql);
            }
            
            // Copy data
            destDb.exec(`INSERT INTO main.${table} SELECT * FROM source.${table};`);
            console.log(`Copied table: ${table} along with its indexes and data.`);
        } else {
            console.warn(`Schema for table ${table} not found.`);
        }
    }
    
    sourceDb.close();
    destDb.exec(`DETACH DATABASE source;`);

    destDb.exec(`VACUUM;`);

    console.log("Successfully created db/production.db");

    // Sync SQLite dump to db/production.sql for Cloudflare D1
    try {
        const dumpSql = execSync(`sqlite3 "${destDbPath}" .dump`, { encoding: 'utf8' });
        fs.writeFileSync(path.resolve('db/production.sql'), dumpSql, 'utf8');
        console.log(`💾 Synced SQLite dump to: db/production.sql`);
    } catch (dumpErr) {
        console.warn(`⚠️ Could not auto-sync production.sql: ${dumpErr.message}`);
    }
} catch (err) {
    console.error("Failed to build production database:", err);
} finally {
    destDb.close();
}
