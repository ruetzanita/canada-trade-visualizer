import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

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
    
    const tables = ['countries', 'macro_monthly_summary'];
    
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
} catch (err) {
    console.error("Failed to build production database:", err);
} finally {
    destDb.close();
}
