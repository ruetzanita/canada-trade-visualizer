# Canada Trade Data Dashboard

## Project Overview
This project is a modern Next.js web application with a SQLite database backend, designed to visualize and analyze Canadian macro trade data. It presents interactive visualizations including a 3D Globe, a Sankey diagram, and collapsible country cards to explore trade metrics across different global regions.

## Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository and navigate to the project root.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Development Server
Start the Next.js development server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

## Data Ingestion Pipeline
The `scripts/ingest_raw_data.mjs` script is responsible for populating the SQLite database with raw trade data from CSV files. 

**How it works:**
1. **Database Connection:** Connects to `db/unified_master.db` using `better-sqlite3`.
2. **Valid Countries Check:** Fetches a list of valid country codes from the `countries` table.
3. **Directory Traversal:** Recursively walks through the `raw_data/` directory looking for CSV files starting with `ODPF`.
4. **CSV Parsing & Batch Insertion:** Reads the matching CSVs using `csv-parser`. It filters rows to include only valid countries and inserts data into the `raw_trade_data` table in batches of 5000 to optimize performance.

## Raw Data Sourcing & Monthly Update Protocol

The raw quantitative trade data is sourced directly from the **Government of Canada Open Government Portal** and **Statistics Canada**:

- **Open Government Portal Dataset:** [Canadian International Merchandise Trade Web Application (CIMT), 2023 - 2026](https://open.canada.ca/data/en/dataset/2909a648-5753-4924-878a-b069392d9cde)
  - **Dataset ID:** `2909a648-5753-4924-878a-b069392d9cde`
  - **Catalogue Number:** 71-607-X
- **Direct Annual / YTD Bulk Download Endpoints:**
  - **2026 (Cumulative YTD):** `https://www150.statcan.gc.ca/n1/pub/71-607-x/2021004/zip/CIMT-CICM_Dom_Exp_2026.zip`
  - **2025 (Full Year):** `https://www150.statcan.gc.ca/n1/pub/71-607-x/2021004/zip/CIMT-CICM_Dom_Exp_2025.zip`
  - **2024 (Full Year):** `https://www150.statcan.gc.ca/n1/pub/71-607-x/2021004/zip/CIMT-CICM_Dom_Exp_2024.zip`
  - **2023 (Full Year):** `https://www150.statcan.gc.ca/n1/pub/71-607-x/2021004/zip/CIMT-CICM_Dom_Exp_2023.zip`

### Bulk Open Data vs. Web Query Builder
- **Use the Bulk `.zip` Archives:** The interactive web query tool on the Statistics Canada CIMT site enforces a **150,000-row limit**, causing multi-month queries at the HS8 level to fail. The official bulk `.zip` download provides complete national trade data without row limits.
- **Archive Contents:**
  - `ODPFN016_YYYYMMN.csv`: HS8 detailed commodity exports by partner country and province (primary ingestion target).
  - `ODPFN018_YYYYMMN.csv`: HS6 aggregated commodity exports.
  - `ODPFN020_YYYYMMN.csv`: HS2 chapter-level commodity exports.
  - `ODPF_*.TXT`: Supporting metadata and classification description tables.
- **Update Frequency & Cumulative Cadence:**
  - Statistics Canada publishes monthly updates approximately **35 days after reference month end**.
  - Current-year archives are cumulative. For example, `CIMT-CICM_Dom_Exp_2026.zip` delivers `ODPFN016_202607N.csv` (January through July 2026) along with retroactive monthly revisions.
- **Monthly Update Procedure:**
  1. Download the latest `CIMT-CICM_Dom_Exp_YYYY.zip` from the direct endpoint above.
  2. Extract the archive into `raw_data/CIMT-CICM_Dom_Exp_YYYY/`, replacing the expired month folder.
  3. Ingest data into `db/unified_master.db` via `node scripts/ingest_raw_data.mjs`.
  4. Compile production edge database via `npm run build:prod`.

## Deployment Pipeline
Before pushing to Cloudflare, developers can run:
```bash
npm run build:prod
```
This automatically compiles `db/production.db` via `scripts/build_production_db.mjs` before executing `next build`.

**Rationale:** The local `unified_master.db` is approximately 2.6 GB (due to 13.4 million rows of raw CSV data) and will crash the Cloudflare D1 free tier upload limits (500MB). The build script extracts a tiny, sub-megabyte `production.db` (~370 KB) specifically for edge querying via Cloudflare Pages Functions (`functions/api/country-metrics.ts` and `functions/api/digest.ts`).

## Autonomous Trade Intelligence Pipeline

The platform incorporates an autonomous two-tier AI Economist pipeline deployed as a scheduled Cloudflare Worker (`workers/economist-agent`):

- **Execution Cadence:** Every Sunday at 20:00 UTC via Cloudflare Cron (`0 20 * * 0`).
- **Tier 1 (Chief Investigative Economist):** Executes `deep-research-pro-preview-12-2025` via Google's asynchronous Interactions API, conducting a comprehensive sweep across whitelisted watchdogs (Global Affairs Canada, Global Trade Alert, Hinrich Foundation, WTO) using the **Four-Pillar Macroeconomic Architecture** (*Sovereign Moves $\rightarrow$ Strategic Wins $\rightarrow$ Macro Hurdles $\rightarrow$ Panoramic Synthesis*).
- **Tier 2 (Desk Compiler):** Compiles the research brief into structured records via `gemini-3.8-flash` (JSON schema mode), updating the public `weekly_digests` table and applying selective $\le 20$-word timestamped updates to affected `country_context` profiles in Cloudflare D1.
- **Offline Dry Run & Local Verification:**
  ```bash
  node scripts/run_economist_dry_run.mjs
  ```
  Runs the full two-tier pipeline against live Google AI APIs and saves the resulting 5-section markdown dossier to `docs/LATEST_RESEARCH_PUBLICATION.md`.

## Developer Guidelines & Directory Rules

To ensure long-term codebase hygiene and prevent file fragmentation, all developers and AI agents must comply with these file placement rules:

1. **Root Directory Policy**:
   - Only primary project configuration (`package.json`, `tsconfig.json`, `wrangler.toml`, `next.config.mjs`, `.gitignore`), primary metadata (`README.md`, `LICENSE.md`, `changelog.md`), and TypeScript definitions (`next-env.d.ts`, `global.d.ts`) may reside in the workspace root.
   - Do NOT save technical specs, test outputs, raw datasets, or database files in root.

2. **Subdirectory Roles**:
   - `docs/`: Technical documentation, storage architecture, and developer guides.
   - `app/`: Next.js pages, CSS modules, layout definitions, and React components (`app/components/`).
   - `functions/`: Cloudflare Pages Functions edge API endpoints (`functions/api/`).
   - `db/`: SQLite database files (`unified_master.db`, `production.db`), SQL patches, and static JSON/TS datasets.
   - `scripts/`: Data ingestion, database build, and maintenance scripts.
   - `scratch/`: Experimental scripts, developer scratchpads, and temporary test files.
   - `reference/`: Strategic explainer guides, cover images, and design reference assets.
   - `archive/`: Legacy scripts.

3. **Database Integrity**:
   - Master data operations target `db/unified_master.db`.
   - Never commit 0-byte database duplicates across subdirectories.

