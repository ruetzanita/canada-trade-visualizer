# Canada Trade Visualizer: Storage Architecture & Dual-Database Framework

## 1. Executive Summary

The **Canada Trade Visualizer** utilizes a highly optimized **Dual-Database Architecture** designed to execute complex macro-economic trade calculations efficiently on serverless infrastructure. By decoupling heavy data ingestion from edge-deployed analytics, the architecture bypasses serverless constraints—most notably Cloudflare D1's 500MB free-tier storage limits and edge compute execution timeouts—while maintaining lightning-fast API responses globally.

## 2. The Dual-Database Strategy

The system separates the data lifecycle into two distinct environments: a heavy local ledger for data processing, and a lightweight cloud repository for production serving.

### A. Heavy Local Ledger (`unified_master.db`)
- **Size & Scope:** ~2.6 GB SQLite database.
- **Function:** Acts as the master ledger containing over 13.4 million rows of raw historical trade data. 
- **Ingestion:** Powered by `scripts/ingest_raw_data.mjs`, this ledger recursively parses gigabytes of Canadian raw trade CSV logs (`ODPF*.csv`) into a structured `raw_trade_data` schema. Datasets are sourced from the Open Government Portal (Dataset `2909a648-5753-4924-878a-b069392d9cde` / Catalogue 71-607-X) via direct cumulative `.zip` endpoints (`https://www150.statcan.gc.ca/n1/pub/71-607-x/2021004/zip/CIMT-CICM_Dom_Exp_YYYY.zip`).
- **Analytical Pre-computation:** Heavy aggregation tasks (summing export values and volumes) are executed locally to produce a materialized view/table named `macro_monthly_summary`. 

### B. Lightweight Production Cloud Repository (`production.db`)
- **Size & Scope:** ~370 KB SQLite database.
- **Function:** A highly condensed, edge-optimized database deployed to **Cloudflare D1** (`trade-dashboard-db`).
- **Extraction:** The `scripts/build_production_db.mjs` script performs a targeted extraction, stripping away the 13.4M rows of raw data and capturing only the pre-computed `macro_monthly_summary` table, qualitative country context (`country_context`), and weekly briefing archives (`weekly_digests`). 
- **Result:** This results in a database that uses merely ~0.07% of Cloudflare D1's 500MB free tier allowance, guaranteeing limitless scaling capabilities for future datasets without incurring premium storage costs.

## 3. Qualitative Intelligence & Autonomous Digest Schema

In addition to quantitative macro metrics, the production database houses two dynamic tables provisioned via `db/migrations/0001_add_qualitative_and_digest_tables.sql`:

### A. `country_context` (Country Profile Qualitative Data)
- **Primary Key:** `country_name` (e.g. `'Germany'`, `'Indonesia'`).
- **Fields:** `country_code`, `region`, `historical_background` (max 35 words), `top_5_commodities` (JSON array), `trade_stance` (1-2 sentences), `deals_and_disruptions` (JSON dictionary of Year -> Bullet String, strictly $\le 20$ words with Month/Year timestamps), `source_link`, `last_updated_at`.
- **Selective Delta Ingestion:** Maintained autonomously by the Tier 2 Gemini 3.8 Flash compiler, which only updates cards for countries with active, verified policy shifts.

### B. `weekly_digests` (Trade Intelligence Briefings & Research Archive)
- **Primary Key:** `id` (e.g. `'2026-W40'`).
- **Fields:** `edition_date`, `headline` ($\le 15$ words), `summary` (minimum 3 paragraphs up to 2 full pages), `key_developments` (JSON array of `{ title, tag, source_name, source_url, description }`), `countries_affected` (JSON array of whitelisted country names), `primary_sources` (JSON array of `{ title, url }`), `full_research_publication` (TEXT), `economist_notes` (TEXT), `created_at`.

---

## 4. Dual-Tier Archival & Data Partitioning Strategy

To guarantee both high-speed edge delivery and complete long-term auditability, the platform enforces strict data partitioning between public client responses and backend storage:

### A. Public Edge Partition (`/api/digest`)
- The edge API strips `full_research_publication` and `economist_notes` prior to returning responses to the browser.
- **Payload Size:** ~4 KB per edition.
- **Impact:** The public Trade Intelligence modal loads instantaneously worldwide without client-side network overhead.

### B. Backend Private Database Partition (Cloudflare D1)
- The unedited 5-section research dossier (~35,000–50,000 characters) produced by Deep Research Pro Preview is saved verbatim into `weekly_digests.full_research_publication`.
- Section 5 early warning indicators and risk notes are stored in `weekly_digests.economist_notes`.
- **Purpose:** Preserves historical ground-truth for longitudinal pattern recognition, auditability, and autonomous longitudinal synthesis over time.

### C. Version-Controlled Markdown Archive (`docs/`)
- **`docs/LATEST_RESEARCH_PUBLICATION.md`**: Continuously overwritten as the active pointer to the most recent weekly publication, enabling immediate human verification in code editors.
- **`docs/archive/`**: Preserves edition-stamped markdown files (`YYYY-Www_research_publication.md` and `YYYY-Www_trade_intelligence.md`) under Git version control.

---

## 5. Capacity Economics & 10-Year Projections

| Metric | Per Edition | 1 Year (52 Weeks) | 5 Years (260 Weeks) | 10 Years (520 Weeks) |
| :--- | :--- | :--- | :--- | :--- |
| **Research Dossier (Backend)** | ~38 KB | ~1.98 MB | ~9.88 MB | ~19.76 MB |
| **Structured Digest (Public)** | ~4 KB | ~0.21 MB | ~1.04 MB | ~2.08 MB |
| **Total Added Storage** | **~42 KB** | **~2.18 MB** | **~10.9 MB** | **~21.8 MB** |
| **% of D1 Free Tier (500 MB)** | < 0.01% | **~0.44%** | **~2.18%** | **~4.36%** |

Even after a decade of continuous weekly autonomous deep research publications, the database will consume less than 4.5% of Cloudflare D1's 500MB free-tier allocation.

---

## 6. Serverless Analytical Math Execution

While the heavy lifting of raw data aggregation happens locally, the dynamic calculation of Year-over-Year (YoY) and Year-to-Date (YTD) growth requires dynamic execution based on the user's interactive timeline scrubber.

These calculations are executed via **Cloudflare Pages Functions** (`functions/api/country-metrics.ts`).

### Edge Processing Workflow:
1. **Dynamic Metric Fetching:** The edge function queries the lightweight D1 database for the targeted year and the previous year, grouped by country and month.
2. **First-Pass Aggregation (YoY):** For historical data (years <= 2025), the function iterates through the results to sum total export values for the target year and the previous year, rendering YoY growth comparisons.
3. **Second-Pass Alignment (YTD):** For incomplete/current years (years >= 2026), the function identifies which specific months have reported data in the current year. It then performs a second pass against the previous year's dataset, dynamically summing only the matching months to calculate an accurate YTD growth percentage.
4. **Data Contextualization:** Quantitative outputs are merged dynamically with the `country_context` table in D1 (with graceful fallback to static JSON modules if D1 is temporarily unreachable).

---

## 7. Conclusion

This architecture achieves an optimal balance between massive historical data processing, real-time edge serving, and autonomous macroeconomic intelligence. By relegating raw data aggregation to local build scripts and partitioning deep research archival strictly to backend columns and Git markdown, the serverless edge functions deliver instantaneous, rich geospatial trade visualizations to end-users worldwide at essentially zero marginal cost.
