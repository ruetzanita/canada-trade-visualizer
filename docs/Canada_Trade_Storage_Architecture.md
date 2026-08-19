# Canada Trade Visualizer: Storage Architecture & Dual-Database Framework

## 1. Executive Summary

The **Canada Trade Visualizer** utilizes a highly optimized **Dual-Database Architecture** designed to execute complex macro-economic trade calculations efficiently on serverless infrastructure. By decoupling heavy data ingestion from edge-deployed analytics, the architecture bypasses serverless constraints—most notably Cloudflare D1's 500MB free-tier storage limits and edge compute execution timeouts—while maintaining lightning-fast API responses globally.

## 2. The Dual-Database Strategy

The system separates the data lifecycle into two distinct environments: a heavy local ledger for data processing, and a lightweight cloud repository for production serving.

### A. Heavy Local Ledger (`unified_master.db`)
- **Size & Scope:** ~2.6 GB SQLite database.
- **Function:** Acts as the master ledger containing over 13.4 million rows of raw historical trade data. 
- **Ingestion:** Powered by `scripts/ingest_raw_data.mjs`, this ledger recursively parses gigabytes of Canadian raw trade CSV logs (`ODPF*.csv`) into a structured `raw_trade_data` schema.
- **Analytical Pre-computation:** Heavy aggregation tasks (summing export values and volumes) are executed locally to produce a materialized view/table named `macro_monthly_summary`. 

### B. Lightweight Production Cloud Repository (`production.db`)
- **Size & Scope:** ~212 KB SQLite database.
- **Function:** A highly condensed, edge-optimized database deployed to **Cloudflare D1**.
- **Extraction:** The `scripts/build_production_db.mjs` script performs a targeted extraction, stripping away the 13.4M rows of raw data and capturing only the pre-computed `macro_monthly_summary` table and necessary indexes from the master ledger. 
- **Result:** This results in a database that uses merely 0.04% of Cloudflare D1's 500MB free tier allowance, guaranteeing limitless scaling capabilities for future datasets without incurring premium storage costs.

## 3. Serverless Analytical Math Execution

While the heavy lifting of raw data aggregation happens locally, the dynamic calculation of Year-over-Year (YoY) and Year-to-Date (YTD) growth requires dynamic execution based on the user's interactive timeline scrubber.

These calculations are executed via **Cloudflare Pages Functions** (`functions/api/country-metrics.ts`).

### Edge Processing Workflow:
1. **Dynamic Metric Fetching:** The edge function queries the lightweight D1 database for the targeted year and the previous year, grouped by country and month.
2. **First-Pass Aggregation (YoY):** For historical data (years <= 2025), the function iterates through the results to sum total export values for the target year and the previous year, rendering YoY growth comparisons.
3. **Second-Pass Alignment (YTD):** For incomplete/current years (years >= 2026), the function identifies which specific months have reported data in the current year. It then performs a second pass against the previous year's dataset, dynamically summing only the matching months to calculate an accurate YTD growth percentage.
4. **Data Contextualization:** Quantitative outputs are merged on the fly with static TypeScript modules (`db/EUD_country_data.ts` and `db/IPD_country_data.ts`) containing qualitative reporting data. 

## 4. Conclusion

This architecture achieves an optimal balance between processing massive datasets and serving them at the edge. By relegating the O(N) complexity of raw aggregation to local build scripts, the serverless edge functions are freed to perform O(1) lookups and lightweight comparative math on pre-summarized data. The result is a sub-megabyte cloud footprint that delivers instantaneous, rich geospatial data visualization to end-users worldwide.
