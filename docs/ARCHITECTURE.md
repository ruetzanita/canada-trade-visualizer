# Architecture Documentation

## Frontend UI Components
The user interface is built with Next.js and React, utilizing several key components for data visualization located in `app/components/`:

- **`GlobeViz`**: A 3D interactive globe component that visualizes macro export values across different countries.
- **`SankeyViz`**: A Sankey diagram component that illustrates the flow of trade from Canada to various international regions, displaying the magnitude of exports dynamically.
- **Collapsible Country Cards**: UI elements rendered on the main page (`page.tsx`) that display specific trade metrics, Year-over-Year (YoY) or Year-to-Date (YTD) growth, and qualitative context for individual countries.
- **`ExpertDigestCard`**: A floating frosted-glass modal ("Trade Intelligence" / "Canada Export Intelligence") presenting the weekly macroeconomic intelligence authored by the autonomous Chief Economist pipeline. Features long-form editorial typography, key developments, verified citations (Global Affairs Canada, Global Trade Alert, Hinrich Foundation, WTO), and interactive country focus chips that dynamically transition the 3D globe across regional views.

## Backend API Contracts
### 1. `functions/api/country-metrics.ts`
This Cloudflare Pages Function edge endpoint handles fetching and calculating macro trade metrics from the D1 database binding (`DB`), merging dynamic quantitative aggregates with the `country_context` table.

- **Method:** `GET`
- **Query Parameters:**
  - `year`: Target year (e.g. `2026`).
  - `region`: Target region, either `EUD` (European Union & EFTA) or `IPD` (Indo-Pacific).
- **Response:** JSON object containing `success`, `data` (with `currentValue`, `growthPercentage`, `calculationType`, and `context`), `chartData`, `globalChartData`, and temporal `metadata`.

### 2. `functions/api/digest.ts`
This Cloudflare Pages Function edge endpoint serves the autonomous weekly macroeconomic intelligence briefings.

- **Method:** `GET`
- **Query Parameters:**
  - `id` (optional): Query a specific edition (e.g. `2026-W40`).
  - `all` (optional): Set to `true` to list past editions.
- **Response:** JSON object containing `success` and `digest` (or `digests`), including:
  - `headline`: Sharp journalistic headline (strictly $\le 15$ words).
  - `summary`: Lead editorial summary (minimum 3 paragraphs, up to 2 pages).
  - `key_developments`: Array of structured highlights with `{ title, tag, source_name, source_url, description }`.
  - `countries_affected`: Array of whitelisted country names directly affected.
  - `primary_sources`: Array of `{ title, url }` outbound verification links.
- **Backend Archival Separation:** The edge endpoint strictly strips `full_research_publication` and `economist_notes` from public responses, keeping the complete ~38 KB research dossier and early warning signals securely private to Cloudflare D1.

## Database Schema (Cloudflare D1: `trade-dashboard-db`)
The project utilizes an edge-optimized database (~370 KB) deployed to Cloudflare D1:

- **`countries`**: Master registry of 60 geopolitical partner entities.
- **`macro_monthly_summary`**: Aggregated monthly export value (CAD) and volume (tonnes).
- **`country_context`**: Dynamic qualitative context for Country Cards (`historical_background`, `top_5_commodities`, `trade_stance`, `deals_and_disruptions`, `source_link`, `last_updated_at`).
- **`weekly_digests`**: Weekly intelligence briefings and backend research archive (`id`, `edition_date`, `headline`, `summary`, `key_developments`, `countries_affected`, `primary_sources`, `full_research_publication`, `economist_notes`, `created_at`).

## Autonomous Export Economist Agent (`workers/economist-agent`)
A scheduled Cloudflare Worker runs every **Sunday at 20:00 UTC** via a Cron Trigger (`0 20 * * 0`):

1. **Tier 1 (Chief Investigative Economist - Deep Research Pro Preview)**:
   - Uses `deep-research-pro-preview-12-2025` via the Google Interactions API (`POST /v1beta/interactions`) with asynchronous polling.
   - Conducts an exhaustive sweep across whitelisted watchdogs (Global Affairs Canada, Statistics Canada, Export Development Canada, Global Trade Alert, Hinrich Foundation, and the WTO).
   - Frames all analysis through the **Four-Pillar Macroeconomic Architecture**:
     1. *Sovereign Moves*: Proactive Canadian capital deployment, trade missions, diplomatic leverage, and treaty architecture.
     2. *Strategic Wins*: Concrete tariff eliminations, investment corridors, and competitive advantages secured.
     3. *Macro Hurdles*: Domestic logistics bottlenecks (rail/ports), foreign compliance barriers (EU CBAM, ESG audits), and geopolitical crosswinds.
     4. *Panoramic Synthesis*: How national and global forces connect to shape Canadian resilience, productivity, and citizen prosperity.
   - Authors a complete 5-section investigative publication dossier (~35,000–50,000 chars) with verified citations.

2. **Tier 2 (Desk Compiler & Spatial Gatekeeper - Gemini 3.8 Flash)**:
   - Operates in high-speed JSON schema mode (`gemini-3.8-flash`).
   - Validates all entities against the 57-country whitelist from `db/geo_metadata.ts`.
   - Distills the research dossier into the public `weekly_digests` record.
   - Selectively updates affected Country Cards in `country_context`: strictly $\le 20$ words per bullet with mandatory `Month YYYY:` timestamps.
   - Archives the complete unedited Tier 1 publication in `full_research_publication` and extracted notes in `economist_notes`.

3. **Dual-Tier Archival & Seamless Autonomy**:
   - Updates Cloudflare D1 directly at the edge, immediately reflecting on the live dashboard without requiring static rebuilds or git commits.
   - Offline verification and dry runs can be executed via `scripts/run_economist_dry_run.mjs`, which simultaneously preserves the latest publication in `docs/LATEST_RESEARCH_PUBLICATION.md`.
