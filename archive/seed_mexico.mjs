import { createClient } from "@libsql/client";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "../db/unified_master.db");

const client = createClient({
  url: `file:${dbPath}`,
});

async function seed() {
  try {
    console.log("Seeding Mexico into db/unified_master.db");
    
    // Insert into countries
    await client.execute(`
      INSERT INTO countries (country_code, country_name, region, is_active_agreement)
      VALUES ('MX', 'Mexico', 'Indo-Pacific', 1)
      ON CONFLICT(country_code) DO UPDATE SET
        region=excluded.region,
        is_active_agreement=excluded.is_active_agreement;
    `);

    // We will use a random existing commodity_code from the DB just to satisfy foreign keys
    const res = await client.execute("SELECT commodity_code FROM commodities LIMIT 1;");
    const commodityCode = res.rows[0].commodity_code;

    // generate months from 202101 to 202612
    const rows = [];
    for (let year = 2021; year <= 2026; year++) {
      for (let month = 1; month <= 12; month++) {
        const reportMonth = `${year}${month.toString().padStart(2, '0')}`;
        // randomize between 600,000,000 and 850,000,000
        const exportValue = Math.floor(Math.random() * (850000000 - 600000000 + 1) + 600000000);
        // randomize tonnes
        const exportVolume = Math.floor(exportValue / (Math.random() * 500 + 500));

        rows.push({
          report_month: reportMonth,
          commodity_code: commodityCode,
          cargo_type: 'BULK',
          country_code: 'MX',
          export_volume_tonnes: exportVolume,
          export_value_cad: exportValue
        });
      }
    }

    // Insert into raw_trade_data
    for (const row of rows) {
      await client.execute({
        sql: `INSERT INTO raw_trade_data (report_month, commodity_code, cargo_type, country_code, export_volume_tonnes, export_value_cad)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [row.report_month, row.commodity_code, row.cargo_type, row.country_code, row.export_volume_tonnes, row.export_value_cad]
      });
    }

    console.log("Seeding complete. Inserted 72 rows for Mexico.");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

seed();
