# Autonomous Export Economist: Two-Tier Model Architecture

This document defines the tasks, sources, outputs, and archival rules for the authorized two-tier pipeline.

---

## The Two-Tier System

| Tier | Model | Role | Frequency | Target Sources | Rate Limits |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | **Deep Research Pro Preview** | Chief Investigative Economist | Weekly (Sunday) | GTA, Hinrich, GAC, WTO | 1 RPM / 1.44K RPD |
| **Tier 2** | **Gemini 3.8 Flash** | Desk Compiler & Data Editor | Weekly (Sunday) | Tier 1 brief, Cloudflare D1 | 1K RPM / 10K RPD |

---

## Tier 1: Deep Research Pro Preview (Chief Investigative Economist)

**Role**: Lead macroeconomic researcher. Performs a single comprehensive investigative sweep across live external trade databases every Sunday.

### Tasks
- **Canada as Sovereign Protagonist**: Analyze global trade from the perspective of Canadian economic statecraft. The narrative focuses on what Canada is proactively doing in the world—forging alliances, executing trade architecture, and expanding commercial corridors across her two designated Target Markets:
  1. **European Union & EFTA (EUD)**
  2. **Indo-Pacific (IPD)**
- **The Four-Pillar Strategic Framework**:
  1. *Sovereign Moves*: Where is Canada positioning her capital, trade missions, diplomatic weight, and trade agreements?
  2. *Strategic Wins*: Tangible market access breakthroughs, tariff eliminations, investment corridors, and competitive advantages being secured.
  3. *Macro Hurdles*: Real structural challenges—domestic logistics and port chokepoints, regulatory compliance barriers abroad (e.g., EU CBAM, ESG standards), and shifting geopolitical crosswinds.
  4. *Panoramic Synthesis*: How these national and international forces connect on a macro level to impact Canadian economic resilience, productivity, and the prosperity of everyday Canadians.
- **Panoramic Macro View (Avoid Microcosms)**: Focus on macro capital formation, industrial capacity, energy transitions, and sovereign economic security rather than narrow, micro-level commodity tracking.
- **Balanced Global Baseline**: Treat continental North American trade as a steady baseline, avoiding sensationalist or reactionary headlines, while training the spotlight on Canada's sovereign expansion into Europe and the Indo-Pacific.
- **Corridors & Logistics**: Investigate domestic Canadian corridors (CN/CPKC rail networks, Port of Vancouver, Prince Rupert, Montreal, Halifax, Saint John, and cold-chain capacity), maritime freight rates, and international regulatory compliance.
- Track bilateral milestones: Team Canada trade missions, CPTPP implementation (including UK accession), CETA utilization, and Canada-Indonesia CEPA progress.
- Author a 5-section in-depth research dossier with verifiable citations.


### Resources
- **Global Trade Alert**: `https://globaltradealert.org/data-center` (tariffs, subsidies, export controls)
- **Hinrich Foundation**: `https://www.hinrichfoundation.com/` (sustainable trade, supply chain diversification)
- **Global Affairs Canada**: `https://www.international.gc.ca` (ministerial statements, bilateral deals)
- **World Trade Organization**: `https://www.wto.org` (dispute notices, trade policy reviews)

### Expected Output Structure (5-Section Research Dossier)
1. **Section 1: The Lead Editorial Summary (Trade Intelligence Brief)**
   - Publication-grade macroeconomic policy monograph (Foreign Affairs / C.D. Howe standard) assessing Canada's weekly trade statecraft and diversification momentum.
   - **Target Length**: Strictly **1,600 to 2,200 words** (no artificial truncation).
   - **Three-Part Structure**:
     1. *Sovereign Opening & Thesis* (~250 words)
     2. *Thematic Deep Dives* (Cherry-picks **4 to 6 themes** from the 8-Theme Strategic Menu below; ~300–400 words per theme with explicit markdown subheadings)
     3. *Panoramic Synthesis & The Canadian Bottom Line* (~250–350 words)
   - **The 8 Strategic Themes Menu**:
     1. Sovereign Trade Architecture & Treaty Execution
     2. Critical Minerals & Strategic Supply Chains
     3. Clean Energy Corridors & Industrial Decarbonization
     4. Agrifood, Fertilizer & Global Food Security
     5. National Corridors & Logistical Fluidity
     6. Regulatory Compliance & Non-Tariff Barriers (EU CBAM/EUDR)
     7. Macro Financial Conditions & Exporter Margins
     8. Geopolitical Crosswinds & Sovereign Defense
   - Serves directly as the lead copy displayed in the UI Trade Intelligence modal.
2. **Section 2: Tariffs & Policy Interventions (Global Trade Alert)**
   - Specific international movement, trade deals, tariff adjustments, countervailing duties, and subsidies targeting Canadian commodities in EUD and IPD.
3. **Section 3: Strategic Corridors & Supply Chains (Hinrich Foundation & GAC)**
   - Canadian logistics corridors (rail, ports), critical minerals, LNG/clean hydrogen pacts, agrifood trade, and treaty milestones.
4. **Section 4: Country Impact Matrix (57 Listed Countries)**
   - Specific Month/Year dates, commodity sectors, policy mechanisms, and source URLs for affected partner nations.
5. **Section 5: Economist Field Notes & Early Signals**
   - Observations on emerging risks, non-tariff frictions, and informal intelligence for longitudinal pattern recognition.

### Archival & Publication Rule
- **Editorial Summary**: Published publicly on the frontend UI inside the Trade Intelligence modal.
- **Full Research Dossier & Notes**: Stored and archived **strictly in the backend** (Cloudflare D1 `weekly_digests` table) for reference, auditability, and pattern recognition over time. It is not exposed on the public frontend.


### Quota Allocation
- **1 call per week** (Sunday at 20:00 UTC). Respects the 1 RPM limit.

---

## Tier 2: Gemini 3.8 Flash (Desk Compiler & Data Editor)

**Role**: High-speed structural compiler and spatial gatekeeper. Takes the Tier 1 research dossier, validates all entities against the 57-country whitelist, and compiles structured records for Cloudflare D1.

### Execution Profile
- **Schedule**: Weekly on Sunday at ~20:05 UTC (triggered immediately after Tier 1).
- **Execution Time**: Sub-second to 2-second structured JSON compilation via `responseMimeType: "application/json"`.
- **Quota**: 1–2 calls per week, well within the 1,000 RPM / 10,000 RPD quota.

### The 5 Core Tasks
1. **Task 1: Compile Public Weekly Digest (`weekly_digests`)**
   - **Headline**: Authoritative journalistic headline (strictly **max 15 words**).
   - **Editorial Summary Preservation**: Preserves Section 1 verbatim or cleanly formatted (minimum 3 full paragraphs, up to 2 pages); no artificial truncation.
   - **Key Developments**: Distills 3 to 5 structured highlights with `{ title (≤10 words), tag, source_name, source_url, description (1–2 sentences) }`.
   - **Tags Whitelist**: Strictly `Policy Watch`, `Bilateral Agreement`, `Market Intelligence`, or `Clean Energy`.
   - **Affected Countries**: Whitelisted countries directly impacted that week.
   - **Primary Citations**: Array of `{ title, url }` outbound links for verification.

2. **Task 2: Backend Archival Separation (D1 Storage)**
   - Routes the complete unedited Tier 1 markdown research dossier into `full_research_publication` in Cloudflare D1.
   - Extracts Section 5 into `economist_notes` for backend audit trails and risk tracking.
   - Keeps both archival fields strictly private to the database (stripped from public `/api/digest` responses).

3. **Task 3: Selective Country Card Delta Processing (`country_context`)**
   - **Selective Gatekeeper**: Scans Section 4 (Country Impact Matrix). Updates **ONLY** countries that experienced active, verified policy shifts or disruptions that week. Countries without new developments remain untouched.
   - **Strict Card Geometry Constraints (350px width limit)**:
     - `deals_and_disruptions`: Exactly 1 bullet for the active year, **strictly ≤ 20 words**.
     - **Mandatory Timestamp**: Must begin with `Month YYYY:` (e.g., *"Sep 2026: Team Canada mission signed preliminary critical mineral export framework in Tokyo."*).
     - `trade_stance`: Exactly 1 punchy sentence (only updated if bilateral stance shifted).

4. **Task 4: 57-Country Whitelist & Geographic Aggregation Enforcement**
   - Strictly enforces the 57-country whitelist from `db/geo_metadata.ts`.
   - Aggregates non-Chile/Brazil South American states under `"Rest of South America"`.
   - Discards any unlisted jurisdictions.

5. **Task 5: Schema Validation & Defensive Execution**
   - Enforces strict JSON output with `response_mime_type: "application/json"`.
   - Protects database integrity with defensive JSON parsing and fallback error handling.

### Resources
- Raw 5-section research dossier from Tier 1 (Deep Research Pro Preview).
- Quantitative totals from Cloudflare D1 (`macro_monthly_summary`).
- Active country whitelist (`db/geo_metadata.ts`).

### Expected Output Schema
Strict JSON payload containing:
```json
{
  "weekly_digest": {
    "id": "2026-W39",
    "edition_date": "2026-09-27",
    "headline": "Max 15 words headline...",
    "summary": "Full multi-paragraph editorial summary (minimum 3 paragraphs, up to 2 pages)...",
    "key_developments": [
      {
        "title": "Title (max 10 words)",
        "tag": "Policy Watch | Bilateral Agreement | Market Intelligence | Clean Energy",
        "source_name": "Global Affairs Canada | Global Trade Alert | Hinrich Foundation | WTO",
        "source_url": "https://...",
        "description": "1-2 sentences on direct export impact."
      }
    ],
    "countries_affected": ["Germany", "Indonesia"],
    "primary_sources": [
      { "title": "Source Title", "url": "https://..." }
    ],
    "full_research_publication": "Complete Tier 1 markdown dossier...",
    "economist_notes": "Section 5 notes and early warning signals..."
  },
  "country_updates": [
    {
      "country_name": "Indonesia",
      "year": "2026",
      "bullet_text": "Sep 2026: Canada-Indonesia CEPA implementation begins, reducing tariffs on Canadian wheat and equipment.",
      "trade_stance": "Strengthening bilateral economic partnership anchored by newly enacted CEPA framework."
    }
  ]
}
```


---

## UI Trade Intelligence Modal Specifications

1. **Independent Edition Browser**:
   - The Trade Intelligence modal operates independently from the Master Timeline Slider.
   - Users can freely browse any past weekly edition via an edition dropdown/selector in the modal header.
2. **Long-Form Reading Pane**:
   - Formats the 3-paragraph to 2-page editorial summary with comfortable typography, line-height, and smooth scrolling.
3. **Interactive Country Focus**:
   - Clicking an affected country chip pivots the 3D globe camera to that nation and opens its Country Card.
4. **Verified Outbound Citations**:
   - Direct clickable links to primary government and watchdog sources (GTA, Hinrich, GAC, WTO).

---

## Strict Guardrails

1. **57-Country Whitelist Only**:
   - Never generate cards or commentary for unlisted countries.
   - Group non-Chile/Brazil South American nations under `"Rest of South America"`.
2. **Whitelisted Sources Only**:
   - Only cite GTA, Hinrich Foundation, GAC, StatsCan, EDC, NRCan, AAFC, and WTO.
   - Reject unverified social media, speculative blogs, and opinion columns.
3. **Mandatory Month/Year Dates**:
   - Every deal or disruption bullet must include a date so users can scrub the timeline slider to verify the trade impact.
4. **Strict Word Caps for Country Cards**:
   - Background: Max 35 words.
   - Deals & Disruptions: Max 20 words per bullet.
   - Top 5 Commodities: Exactly 5 items, max 4 words each.
