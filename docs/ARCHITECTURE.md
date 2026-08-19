# Architecture Documentation

## Frontend UI Components
The user interface is built with Next.js and React, utilizing several key components for data visualization located in `app/components/`:

- **`GlobeViz`**: A 3D interactive globe component that visualizes macro export values across different countries.
- **`SankeyViz`**: A Sankey diagram component that illustrates the flow of trade from Canada to various international regions, displaying the magnitude of exports dynamically.
- **Collapsible Country Cards**: UI elements rendered on the main page (`page.tsx`) that display specific trade metrics, Year-over-Year (YoY) or Year-to-Date (YTD) growth, and qualitative context for individual countries. They can be expanded to reveal more granular data.

## Backend API Contract
### `functions/api/country-metrics.ts`
This Cloudflare Pages Function edge endpoint handles fetching and calculating macro trade metrics from the D1 database binding (`DB`).

- **Method:** `GET`
- **Query Parameters:**
  - `year`: The target year for the data (defaults to the current year).
  - `region`: The target region, either `EUD` (European Union) or `IPD` (Indo-Pacific) (defaults to `EUD`).
- **Response:** JSON object containing:
  - `success`: Boolean indicating if the request was successful.
  - `data`: Array of objects for each country, including:
    - `country_name` & `country_code`
    - `year` & `calculationType` (`YoY` or `YTD`)
    - `currentValue` & `comparisonValue`
    - `growthPercentage`
    - `context`: Qualitative context.
  - `chartData`: Monthly export data (excluding the US).
  - `globalChartData`: Global monthly export data (including the US).

## Database Schema
The project utilizes a dual-database architecture to evade Cloudflare D1 Free Tier storage limits (500MB):
- **Heavy Local Ledger (`unified_master.db`)**: Used locally, containing ~1.3 GB of data (13.4 million rows of raw CSV data).
- **Lightweight Cloud Repository (`production.db`)**: A tiny, sub-megabyte database extracted specifically for cloud deployment.

### `macro_monthly_summary`
This table or materialized view provides aggregated macro trade data by country and month, used by the API (`lib/db.ts`) for fast querying.
- `report_month`: The month of the report (e.g., `YYYYMM`).
- `country_code`: The identifier for the country.
- `total_export_value_cad`: The aggregated export value in CAD.
- `total_export_volume_tonnes`: The aggregated export volume in tonnes.

### Qualitative JSON Context Files
Located in the `db/` directory, these files provide qualitative background information for specific countries and regions:
- `db/EUD_country_data.json`: Contains contextual data for European Union countries.
- `db/IPD_country_data.json`: Contains contextual data for Indo-Pacific countries.

These files are read dynamically by the API route and merged with the quantitative database metrics to provide a comprehensive view of the trade relationships.
