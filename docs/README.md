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

## Deployment Pipeline
Before pushing to Cloudflare, developers can run:
```bash
npm run build:prod
```
This automatically compiles `db/production.db` via `scripts/build_production_db.mjs` before executing `next build`.

**Rationale:** The local `unified_master.db` is approximately 2.6 GB (due to 13.4 million rows of raw CSV data) and will crash the Cloudflare D1 free tier upload limits (500MB). The build script extracts a tiny, sub-megabyte `production.db` specifically for edge querying via Cloudflare Pages Functions (`functions/api/country-metrics.ts`).

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

