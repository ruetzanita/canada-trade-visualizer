// scripts/run_economist_dry_run.mjs
// Decomposed, multi-stage live runner for the Autonomous Export Economist pipeline
// Enforces Canadian perspective, senior investigative trade journalism standard, and zero truncation.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables
if (fs.existsSync(path.join(rootDir, '.env'))) {
  process.loadEnvFile(path.join(rootDir, '.env'));
}

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌ Error: GEMINI_API_KEY not found in .env!");
  process.exit(1);
}

const DEFAULT_MODEL = 'gemini-3.8-flash';

export const EUD_COUNTRIES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Denmark', 'Estonia',
  'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy',
  'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Norway',
  'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
  'Switzerland', 'Ukraine', 'United Kingdom'
];

export const IPD_COUNTRIES = [
  'Australia', 'Bangladesh', 'Brunei', 'China', 'Hong Kong', 'India', 'Indonesia',
  'Japan', 'Malaysia', 'New Zealand', 'Philippines', 'Singapore', 'South Korea',
  'Taiwan', 'Thailand', 'Vietnam', 'Brazil', 'Chile', 'Peru',
  'Rest of South America', 'Mexico'
];

export const LISTED_COUNTRIES = [
  ...EUD_COUNTRIES,
  ...IPD_COUNTRIES,
  'United States', 'Canada'
];

export const TRADE_REPORTER_SYSTEM_PROMPT = `
You are a senior Canadian investigative business and trade reporter specializing in international commerce, supply chains, and sovereign economic policy.
Your mandate is to provide sharp, muscular, skeptical Canadian economic intelligence on Canada’s commercial trade diversification beyond North America.

CORE EDITORIAL RULES & THE CANADIAN PERSPECTIVE:
1. Canada is the Protagonist: Trade flows and policy are analyzed from the vantage point of the Canadian corporate ledger, provincial resource economics, and federal policy execution. This is a Canadian project about Canadian sovereignty and market diversification.
2. The 75% Baseline: Acknowledge that continental North American trade (~75% of exports) is Canada's existing volume baseline. The story is what Canada is doing to develop the remaining 25%—active diversification into the Indo-Pacific (IPD) and European Union (EUD).
3. Grounded in Canadian Machinery: Ground stories in Canadian institutions and logistics: Export Development Canada (EDC), the Trade Commissioner Service (TCS), Bank of Canada rate divergences, Transport Canada, port dwell times at Vancouver/Prince Rupert/Montreal/Halifax, and CN/CPKC rail networks.
4. Hard-Nosed Journalistic Skepticism: No cheerleading or government press-release fluff. Examine real friction: dockworker strikes, demurrage costs, EU CBAM carbon border penalties on Canadian metals, European agricultural non-tariff barriers under CETA, shipping rate spikes, and counterparty risks.
5. STRICT BANNED CLICHÉS (NEVER USE THESE WORDS OR PATTERNS):
   - "sovereign statecraft", "sovereign protagonist", "panoramic synthesis", "macroeconomic mosaic", "deliberate transition", "vanguard", "catalyst", "testament", "tapestry", "pivotal", "synergies", "multi-vector", "from coast to coast".
   - Never open with: "As the [quarter/month] unfolds...", "Against the backdrop of...", "In an increasingly volatile world...", or "Canada's trade architecture is undergoing...".
6. The Inverted Pyramid Lead: The opening paragraph must start like a hard news lead—naming a concrete event, a specific dollar figure, a port volume shift, or a trade dispute that occurred this week.
7. Verification & Dates: Every development must reference an explicit Month/Year (e.g., "Oct 2026: ...") and verifiable Canadian trade data.
8. No ASCII Art: Never output ASCII box drawings, pseudo-charts, or text wireframes. Use clean Markdown tables and subheadings.
9. Strict UI Spatial Constraints (Country Cards are fixed at 350px width):
   - deals_and_disruptions entry: Max 20 words per year bullet. Must contain Month/Year timestamp.
   - trade_stance: 1-2 tight, punchy sentences.
`;

function buildIPDResearchPrompt(currentYear, quantitativeSummary) {
  return `
Conduct an investigative fact-gathering sweep of Canadian commercial trade, logistics, and bilateral policy developments in the INDO-PACIFIC (IPD) basin over the past 7 to 30 days.

Target Region (IPD - 21 economies):
${JSON.stringify(IPD_COUNTRIES)}

Recent Trade Volumes for Context (from Statistics Canada):
${quantitativeSummary}

Key Focus Corridors & Sectors:
1. West Coast Maritime Gateways: Port of Vancouver, Port of Prince Rupert, CN and CPKC transpacific rail velocity, container dwell times, grain/coal loading terminals.
2. Critical Minerals & Clean Tech: Lithium, nickel, cobalt, graphite offtake pacts with Japanese, South Korean, and Taiwanese industrial conglomerates; METI/MOTIE subsidies.
3. Agrifood & Bulk Commodities: Prairie wheat, canola seed, yellow peas/pulses (India tariff exemptions/tariffs), potash shipments via Canpotex to Southeast Asia (Indonesia, Malaysia, Vietnam).
4. Bilateral Treaties & Tariffs: CPTPP implementation, Canada-Indonesia CEPA progress, foreign investment protection agreements (FIPA).

REQUIRED OUTPUT FORMAT (Markdown):
## 1. Top Indo-Pacific Breaking Events & Policy Interventions
(List 3-5 verified events from the past 7-30 days with exact dates, commercial entities, tariff schedules, and verifiable source URLs from Global Affairs Canada, Global Trade Alert, Hinrich Foundation, or WTO).

## 2. West Coast Logistics & Corridor Velocity
(Specific container dwell times, rail car availability, port congestion, maritime freight rates).

## 3. Country Card Delta Updates (Active IPD Nations Only)
For each IPD country that experienced a verified, active shift this week (maximum 5-8 countries):
- **Country Name**: (Must be strictly from IPD list)
- **Month/Year**: (e.g., Oct ${currentYear})
- **Bullet Text**: (Strictly ≤ 20 words, must start with "Month Year:", summarizing the exact shift)
- **Trade Stance**: (1 punchy sentence summarizing current bilateral posture)
- **Deep Source URL**: (Direct, specific URL—NOT homepages like international.gc.ca)

## 4. Pacific Early Signals & Field Notes
(2-3 paragraphs of qualitative early warning signals, regulatory friction, or informal market intelligence for Canadian exporters).
`;
}

function buildEUDResearchPrompt(currentYear, quantitativeSummary) {
  return `
Conduct an investigative fact-gathering sweep of Canadian commercial trade, logistics, and bilateral policy developments in the EUROPEAN UNION & EFTA (EUD) basin over the past 7 to 30 days.

Target Region (EUD - 33 economies):
${JSON.stringify(EUD_COUNTRIES)}

Recent Trade Volumes for Context (from Statistics Canada):
${quantitativeSummary}

Key Focus Corridors & Sectors:
1. East Coast Maritime Gateways: St. Lawrence Seaway, Port of Montreal, Port of Halifax, Port of Saint John, transatlantic shipping fluidity, container dwell times.
2. Carbon Border & Regulatory Barriers: EU CBAM compliance impact on Canadian hydro-aluminum smelters (Quebec/BC), steel, and fertilizers; EUDR deforestation compliance on Canadian pulp/forestry; CETA joint committee rulings.
3. Energy & Strategic Commodities: Transatlantic green hydrogen/ammonia alliances with Germany and the Netherlands; civil nuclear/SMR reactor engineering (OPG in Romania/Poland/Czechia); critical mineral offtakes with European automakers.
4. Agrifood: Non-tariff sanitary/phytosanitary issues (durum wheat mycotoxin limits in Italy, pulse drying agents).

REQUIRED OUTPUT FORMAT (Markdown):
## 1. Top European Breaking Events & Regulatory Shifts
(List 3-5 verified events from the past 7-30 days with exact dates, policy mechanisms, EU directives, and verifiable source URLs from Global Affairs Canada, Global Trade Alert, Hinrich Foundation, or European Commission/WTO).

## 2. Atlantic Logistics & Gateway Status
(Container dwell times at Halifax/Montreal, shipping rate trends, rail connections into Central Canada).

## 3. Country Card Delta Updates (Active European Nations Only)
For each European country that experienced a verified, active shift this week (maximum 5-8 countries):
- **Country Name**: (Must be strictly from EUD list)
- **Month/Year**: (e.g., Oct ${currentYear})
- **Bullet Text**: (Strictly ≤ 20 words, must start with "Month Year:", summarizing the exact shift)
- **Trade Stance**: (1 punchy sentence summarizing current bilateral posture)
- **Deep Source URL**: (Direct, specific URL—NOT homepages like international.gc.ca)

## 4. Atlantic Early Signals & Field Notes
(2-3 paragraphs of qualitative early warning signals, regulatory hurdles, or non-tariff barriers facing Canadian exporters).
`;
}

function buildLeadEditorialPrompt(ipdBrief, eudBrief, currentYear, editionDate) {
  return `
You are writing the lead weekly macroeconomic trade cover story for the Canada Trade Visualizer.
Your audience consists of Canadian business executives, trade commissioners, logistics operators, and policymakers.
Style: Senior Canadian investigative trade journalism (incisive, grounded, empirical).

INTELLECTUAL MANDATE:
- Synthesize the verified factual findings from the Indo-Pacific (IPD) and European Union (EUD) intelligence briefs below.
- Write a compelling, hard-nosed Canadian trade investigation.
- Length: Strictly 1,200 to 1,500 words. (Every paragraph must be packed with facts, numbers, and analysis. Zero filler).
- Voice: Muscular, skeptical, realistic. Highlight the trade-offs: what is working, what is stalled, where Canadian exporters are hitting regulatory walls, and what the monetary stakes are.

STRICT BANNED WORDS & OPENINGS:
- DO NOT USE: "sovereign statecraft", "sovereign protagonist", "panoramic synthesis", "macroeconomic mosaic", "deliberate transition", "vanguard", "catalyst", "testament", "tapestry", "pivotal", "synergies", "multi-vector", "from coast to coast".
- DO NOT OPEN WITH: "As the [quarter/month] unfolds...", "Against the backdrop of...", "In an increasingly volatile world...", or "Canada's trade architecture is undergoing...".

CRITICAL FORMATTING & PROSE RULES:
- ABSOLUTELY NO OUTLINE HEADERS OR STRUCTURAL META-LABELS: NEVER output "# Part 1", "# Part 2", "# Part 3", "Part 1: The Lead", "Theme 1", or "Section 1". This is a finished magazine feature article.
- Start IMMEDIATELY with the opening paragraph. Do NOT prepend any title, subtitle, or "Part 1" header.
- Use ONLY organic, informative journalistic subheadings (e.g. "## Pacific Gateways: Offtake Expansion and Regulatory Friction", "## The Atlantic Gauntlet: Brussels Carbon Borders", "## The Bottom Line") to break up thematic shifts.

NARRATIVE FLOW (Flow naturally without meta-labels):
1. The Hard News Opening (~250 words): Start immediately with the single most consequential trade, tariff, or corridor event that occurred this week. Establish the stakes: CAD dollar volumes, affected Canadian provinces, corporate balance sheets, and reducing reliance on the US baseline.
2. Thematic Deep Dives (~700-900 words): Break into 3-4 sections with descriptive subheadings (e.g. "## Pacific Gateways: ...", "## The Atlantic Gauntlet: ...", "## Agrifood Defense: ...", "## Transport Chokepoints: ..."). Include specific companies, port dwell times, tonnages, and dollar figures.
3. The Concluding Synthesis (~250-350 words): Use the header "## The Bottom Line". Analyze the net impact on Canadian exporter profit margins, currency valuation, and employment. Conclude with the next regulatory or operational hurdle.

---
RAW INDO-PACIFIC (IPD) INTELLIGENCE:
${ipdBrief}

---
RAW EUROPEAN UNION (EUD) INTELLIGENCE:
${eudBrief}
`;
}

function buildD1CompilerPrompt(editorialArticle, ipdBrief, eudBrief, currentYear, editionId, editionDate) {
  return `
You are the Desk Compiler for the Canada Trade Visualizer.
Convert the provided lead editorial briefing and the regional intelligence briefs into structured JSON format for edge database insertion.

CRITICAL INSTRUCTIONS:
1. Headline: An incisive, professional journalistic headline (strictly ≤ 15 words). No clickbait.
2. Summary: The complete, verbatim text of the Lead Editorial Article (Parts 1, 2, and 3). Do NOT summarize, truncate, or rewrite.
3. Key Developments: Extract 3 to 5 structured highlights from the article and regional briefs.
   Each item must be:
   - title: Max 10 words.
   - tag: Strictly one of: "Policy Watch", "Bilateral Agreement", "Market Intelligence", "Clean Energy".
   - source_name: Name of publishing institution (e.g. Global Affairs Canada, Global Trade Alert, Hinrich Foundation, WTO, Port of Vancouver).
   - source_url: Direct specific URL (NOT bare root domains like https://www.international.gc.ca).
   - description: 1-2 tight sentences detailing direct export or supply chain impact.
4. Countries Affected: Whitelisted country names directly mentioned as having active commercial developments.
5. Primary Sources: Array of 3-5 verified outbound citations with exact document/article titles and specific URLs.
6. Economist Notes: Extract and synthesize the early warning signals from Section 4 of the IPD and EUD briefs (concise, analytical notes for internal audit).
7. Country Updates: Extract all country card delta updates from the IPD and EUD briefs.
   - country_name: Must be in ${JSON.stringify(LISTED_COUNTRIES)}.
   - year: "${currentYear}"
   - bullet_text: Strictly ≤ 20 words, must begin with "Month YYYY:" (e.g., "Oct ${currentYear}: ...").
   - trade_stance: 1 punchy sentence.

LEAD EDITORIAL BRIEFING:
${editorialArticle}

INDO-PACIFIC BRIEF:
${ipdBrief}

EUROPEAN UNION BRIEF:
${eudBrief}

OUTPUT STRICT JSON ONLY:
{
  "weekly_digest": {
    "id": "${editionId}",
    "edition_date": "${editionDate}",
    "headline": "...",
    "summary": "...",
    "key_developments": [
      {
        "title": "...",
        "tag": "Policy Watch | Bilateral Agreement | Market Intelligence | Clean Energy",
        "source_name": "...",
        "source_url": "...",
        "description": "..."
      }
    ],
    "countries_affected": ["..."],
    "primary_sources": [
      { "title": "...", "url": "..." }
    ],
    "economist_notes": "..."
  },
  "country_updates": [
    {
      "country_name": "...",
      "year": "${currentYear}",
      "bullet_text": "...",
      "trade_stance": "..."
    }
  ]
}
`;
}

async function callGeminiModel(model, prompt, systemInstruction, enableGrounding = false, jsonMode = false) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { 
      temperature: 0.2,
      maxOutputTokens: 32768
    }
  };

  if (jsonMode) {
    body.generationConfig.responseMimeType = 'application/json';
  }

  if (enableGrounding) {
    body.tools = [{ googleSearch: {} }];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': API_KEY
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`No text returned by ${model}`);
  }
  return text;
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`🇨🇦 AUTONOMOUS TRADE INTELLIGENCE: DECOMPOSED PIPELINE`);
  console.log(`   (Senior Investigative Standard | Gemini 3.8 Flash | Zero Truncation)`);
  console.log(`======================================================\n`);

  const dbPath = path.join(rootDir, 'db', 'production.db');
  const masterDbPath = path.join(rootDir, 'db', 'unified_master.db');

  const db = new Database(dbPath);
  let masterDb = null;
  if (fs.existsSync(masterDbPath)) {
    try { masterDb = new Database(masterDbPath); } catch {}
  }

  // 0. Clean old faulty entries as requested
  console.log(`🧹 Deleting old/faulty test entries from weekly_digests in local database...`);
  const delStmt = db.prepare(`DELETE FROM weekly_digests WHERE id IN ('2026-W38', '2026-W39', '2026-W40', '2026-W41')`);
  const delResult = delStmt.run();
  console.log(`   Cleared ${delResult.changes} legacy records from weekly_digests.`);
  if (masterDb) {
    try { masterDb.prepare(`DELETE FROM weekly_digests WHERE id IN ('2026-W38', '2026-W39', '2026-W40', '2026-W41')`).run(); } catch {}
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const weekNum = Math.ceil((((now - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
  const editionId = `${currentYear}-W${String(weekNum).padStart(2, '0')}`;
  const editionDate = now.toISOString().split('T')[0];

  console.log(`📅 Publishing Edition: ${editionId} (${editionDate})`);

  // 1. Gather Macro Baseline Context
  console.log(`📊 Querying macro trade totals for ${currentYear}...`);
  const macroRows = db.prepare(`
    SELECT c.country_name, SUM(r.total_export_value_cad) as total_val
    FROM macro_monthly_summary r
    JOIN countries c ON r.country_code = c.country_code
    WHERE SUBSTR(CAST(r.report_month AS TEXT), 1, 4) = ?
    GROUP BY c.country_name
    ORDER BY total_val DESC
    LIMIT 15
  `).all(currentYear.toString());

  const quantitativeSummary = macroRows
    .map(r => `${r.country_name}: CAD $${(Number(r.total_val) / 1000000).toFixed(1)}M`)
    .join(', ');

  console.log(`   Baseline Context: ${quantitativeSummary.slice(0, 120)}...\n`);

  // 2. Stage 1: Parallel Regional Investigations (Flash + Google Search Grounding)
  console.log(`🔍 [Stage 1] Executing parallel regional sweeps via Gemini 3.8 Flash + Search Grounding...`);
  console.log(`   • Sweep 1A: Indo-Pacific (IPD - 21 countries, Vancouver/Rupert gateways)`);
  console.log(`   • Sweep 1B: European Union & EFTA (EUD - 33 countries, Montreal/Halifax, CBAM)`);

  const [ipdBrief, eudBrief] = await Promise.all([
    callGeminiModel(DEFAULT_MODEL, buildIPDResearchPrompt(currentYear, quantitativeSummary), TRADE_REPORTER_SYSTEM_PROMPT, true),
    callGeminiModel(DEFAULT_MODEL, buildEUDResearchPrompt(currentYear, quantitativeSummary), TRADE_REPORTER_SYSTEM_PROMPT, true)
  ]);

  console.log(`   ✅ Stage 1 complete! IPD Brief (${ipdBrief.length} chars) | EUD Brief (${eudBrief.length} chars)`);

  // 3. Stage 2: The Lead Editorial Monograph (Flash as Lead Writer)
function cleanEditorialProse(rawText) {
  if (!rawText) return '';
  return rawText
    // Replace Part 3 / Concluding header with clean journalistic header if needed
    .replace(/^#+\s*Part\s*3[:\s-]*(The\s+Canadian\s+Bottom\s+Line|The\s+Bottom\s+Line|Conclusion)?.*$/gim, '## The Bottom Line')
    // Remove any remaining Part 1, Part 2, etc.
    .replace(/^#+\s*Part\s*\d+.*$/gim, '')
    // Remove any Theme 1, Section 1 headers
    .replace(/^#+\s*(Theme|Section)\s*\d+.*$/gim, '')
    // Clean excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

  console.log(`\n✍️ [Stage 2] Commissioning Lead Editorial Cover Story...`);
  const editorialPrompt = buildLeadEditorialPrompt(ipdBrief, eudBrief, currentYear, editionDate);
  const rawArticle = await callGeminiModel(DEFAULT_MODEL, editorialPrompt, TRADE_REPORTER_SYSTEM_PROMPT, false);
  const editorialArticle = cleanEditorialProse(rawArticle);

  const wordCount = editorialArticle.trim().split(/\s+/).filter(Boolean).length;
  console.log(`   ✅ Stage 2 complete! Article Word Count: ${wordCount} words (Target: 1,200 - 1,500)`);

  // 4. Stage 3: Structured Desk Compiler (Flash JSON Mode)
  console.log(`\n⚡ [Stage 3] Compiling briefing into edge database JSON...`);
  const compilerPrompt = buildD1CompilerPrompt(editorialArticle, ipdBrief, eudBrief, currentYear, editionId, editionDate);
  const rawCompilerJson = await callGeminiModel(DEFAULT_MODEL, compilerPrompt, TRADE_REPORTER_SYSTEM_PROMPT, false, true);

  let structuredData;
  try {
    let cleaned = rawCompilerJson.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    structuredData = JSON.parse(cleaned);
  } catch (err) {
    console.error(`❌ JSON Parse Error:`, err.message);
    console.error(`Raw output:`, rawCompilerJson);
    process.exit(1);
  }

  const digest = structuredData.weekly_digest;
  digest.summary = cleanEditorialProse(digest.summary);
  const countryUpdates = structuredData.country_updates || [];

  console.log(`\n📰 PUBLICATION SUMMARY:`);
  console.log(`   ID: ${digest.id}`);
  console.log(`   Headline: "${digest.headline}"`);
  console.log(`   Summary Word Count: ${digest.summary.trim().split(/\s+/).filter(Boolean).length} words`);
  console.log(`   Key Developments (${digest.key_developments?.length || 0}):`);
  (digest.key_developments || []).forEach(k => console.log(`     • [${k.tag}] ${k.title} (${k.source_name})`));
  console.log(`   Countries Affected: ${(digest.countries_affected || []).join(', ')}`);
  console.log(`   Primary Sources: ${digest.primary_sources?.length || 0}`);
  console.log(`   Economist Notes: "${(digest.economist_notes || '').slice(0, 100)}..."`);
  console.log(`   Country Card Updates: ${countryUpdates.length} countries`);

  // Full research publication combines Editorial + IPD + EUD cleanly
  const fullResearchPublication = `# Autonomous Export Economist: Full Research Publication
**Edition**: ${editionId} (${editionDate})
**Standard**: Canadian Investigative Trade & Export Intelligence
**Archived**: ${new Date().toISOString()}

---

# SECTION 1: THE LEAD EDITORIAL BRIEFING
${digest.summary}

---

# SECTION 2: INDO-PACIFIC (IPD) REGIONAL INTELLIGENCE
${ipdBrief}

---

# SECTION 3: EUROPEAN UNION & EFTA (EUD) REGIONAL INTELLIGENCE
${eudBrief}

---

# SECTION 4: ECONOMIST FIELD NOTES & EARLY SIGNALS
${digest.economist_notes || 'All regional corridors operating within verified operational parameters.'}
`;

  // 5. Save to Local Production Database
  console.log(`\n💾 Writing to local production database...`);
  const upsertStmt = db.prepare(`
    INSERT INTO weekly_digests (
      id, edition_date, headline, summary, key_developments,
      countries_affected, primary_sources, full_research_publication,
      economist_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      headline = excluded.headline,
      summary = excluded.summary,
      key_developments = excluded.key_developments,
      countries_affected = excluded.countries_affected,
      primary_sources = excluded.primary_sources,
      full_research_publication = excluded.full_research_publication,
      economist_notes = excluded.economist_notes
  `);

  upsertStmt.run(
    digest.id,
    digest.edition_date,
    digest.headline,
    digest.summary,
    JSON.stringify(digest.key_developments || []),
    JSON.stringify(digest.countries_affected || []),
    JSON.stringify(digest.primary_sources || []),
    fullResearchPublication,
    digest.economist_notes || null
  );

  if (masterDb) {
    try {
      masterDb.prepare(`
        INSERT INTO weekly_digests (
          id, edition_date, headline, summary, key_developments,
          countries_affected, primary_sources, full_research_publication,
          economist_notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          headline = excluded.headline,
          summary = excluded.summary,
          key_developments = excluded.key_developments,
          countries_affected = excluded.countries_affected,
          primary_sources = excluded.primary_sources,
          full_research_publication = excluded.full_research_publication,
          economist_notes = excluded.economist_notes
      `).run(
        digest.id,
        digest.edition_date,
        digest.headline,
        digest.summary,
        JSON.stringify(digest.key_developments || []),
        JSON.stringify(digest.countries_affected || []),
        JSON.stringify(digest.primary_sources || []),
        fullResearchPublication,
        digest.economist_notes || null
      );
    } catch {}
  }

  // 6. Apply Selective Country Card Updates
  console.log(`\n🌍 Applying Selective Country Updates:`);
  for (const upd of countryUpdates) {
    if (!LISTED_COUNTRIES.includes(upd.country_name)) {
      console.log(`   ⏭️ Skipping unlisted country: ${upd.country_name}`);
      continue;
    }

    const row = db.prepare('SELECT deals_and_disruptions, trade_stance FROM country_context WHERE country_name = ?').get(upd.country_name);
    if (row) {
      let deals = {};
      try { deals = JSON.parse(row.deals_and_disruptions || '{}'); } catch {}
      const yearKey = String(upd.year || currentYear);
      deals[yearKey] = upd.bullet_text;

      const newStance = upd.trade_stance || row.trade_stance;

      db.prepare(`
        UPDATE country_context 
        SET deals_and_disruptions = ?, trade_stance = ?, last_updated_at = CURRENT_TIMESTAMP
        WHERE country_name = ?
      `).run(JSON.stringify(deals), newStance, upd.country_name);

      if (masterDb) {
        try {
          masterDb.prepare(`
            UPDATE country_context 
            SET deals_and_disruptions = ?, trade_stance = ?, last_updated_at = CURRENT_TIMESTAMP
            WHERE country_name = ?
          `).run(JSON.stringify(deals), newStance, upd.country_name);
        } catch {}
      }

      console.log(`   ✅ [${upd.country_name}] (${upd.bullet_text.split(' ').length} words): "${upd.bullet_text}"`);
    }
  }

  // 7. Generate D1 Execution Patch (db/latest_week_patch.sql) with Old Entries Deletion Prepend
  function escapeSql(val) {
    if (val === null || val === undefined) return 'NULL';
    return `'` + String(val).replace(/'/g, "''") + `'`;
  }

  const patchStatements = [];

  // PS: Deleting old entries from D1
  patchStatements.push(`-- 1. Clean up legacy/faulty entries from remote Cloudflare D1
DELETE FROM weekly_digests WHERE id IN ('2026-W38', '2026-W39', '2026-W40', '2026-W41');`);

  // Insert the new clean weekly digest
  patchStatements.push(`-- 2. Insert verified weekly digest
INSERT INTO weekly_digests (
  id, edition_date, headline, summary, key_developments,
  countries_affected, primary_sources, full_research_publication,
  economist_notes, created_at
) VALUES (
  ${escapeSql(digest.id)},
  ${escapeSql(digest.edition_date)},
  ${escapeSql(digest.headline)},
  ${escapeSql(digest.summary)},
  ${escapeSql(JSON.stringify(digest.key_developments || []))},
  ${escapeSql(JSON.stringify(digest.countries_affected || []))},
  ${escapeSql(JSON.stringify(digest.primary_sources || []))},
  ${escapeSql(fullResearchPublication)},
  ${escapeSql(digest.economist_notes || null)},
  CURRENT_TIMESTAMP
);`);

  // Update country context cards
  for (const upd of countryUpdates) {
    if (!LISTED_COUNTRIES.includes(upd.country_name)) continue;
    const row = db.prepare('SELECT deals_and_disruptions, trade_stance FROM country_context WHERE country_name = ?').get(upd.country_name);
    if (row) {
      patchStatements.push(`UPDATE country_context SET deals_and_disruptions = ${escapeSql(row.deals_and_disruptions)}, trade_stance = ${escapeSql(row.trade_stance)}, last_updated_at = CURRENT_TIMESTAMP WHERE country_name = ${escapeSql(upd.country_name)};`);
    }
  }

  const patchFilePath = path.join(rootDir, 'db', 'latest_week_patch.sql');
  fs.writeFileSync(patchFilePath, patchStatements.join('\n\n') + '\n', 'utf8');
  console.log(`\n💾 Generated D1 execution patch: db/latest_week_patch.sql`);

  // 8. Convert SQL Text into a Clean Human-Readable Verification Document
  console.log(`📄 Generating verification documentation for human review...`);
  const verificationDocPath = path.join(rootDir, 'docs', 'VERIFICATION_BRIEFING.md');
  const pubFilePath = path.join(rootDir, 'docs', 'LATEST_RESEARCH_PUBLICATION.md');

  const verificationDocContent = `# Canada Trade Intelligence: Weekly Briefing Verification Document
**Edition ID**: \`${digest.id}\` | **Date**: \`${digest.edition_date}\` | **Standard**: Canadian Investigative Trade & Export Intelligence
**Generated**: ${new Date().toISOString()}

> [!NOTE]
> This document has been compiled directly from the live multi-stage pipeline run. 
> Old faulty entries (\`2026-W38\`, \`2026-W39\`, \`2026-W40\`, \`2026-W41\`) have been purged from \`db/production.db\` and scheduled for deletion in the D1 deployment patch.

---

## 1. Editorial Headline
# ${digest.headline}

---

## 2. Lead Editorial Article (Canadian Trade Intelligence Standard)
**Word Count**: ${digest.summary.trim().split(/\s+/).filter(Boolean).length} words | **Target**: 1,200 - 1,500 words

${digest.summary}

---

## 3. Key Developments Strip (For Frontend Cards)
${(digest.key_developments || []).map((k, idx) => `
### ${idx + 1}. [${k.tag}] ${k.title}
- **Source**: ${k.source_name}
- **Verification Link**: [${k.source_url}](${k.source_url})
- **Impact Summary**: ${k.description}
`).join('\n')}

---

## 4. Countries Affected
${(digest.countries_affected || []).map(c => `\`${c}\``).join(' • ')}

---

## 5. Primary Outbound Sources (Deep Links)
${(digest.primary_sources || []).map(s => `- [${s.title}](${s.url}) (\`${s.url}\`)`).join('\n')}

---

## 6. Economist Field Notes & Early Warning Signals (Section 5 Backend Audit)
${digest.economist_notes || 'All monitored trade corridors operating within baseline parameters.'}

---

## 7. Selective Country Card Updates (\`country_context\`)
The following ${countryUpdates.length} partner nations experienced active, verified shifts this week:

| Country | Year | Card Bullet Text (≤ 20 words, with timestamp) | Bilateral Trade Stance (1 sentence) |
| :--- | :---: | :--- | :--- |
${countryUpdates.map(u => `| **${u.country_name}** | \`${u.year}\` | ${u.bullet_text} | ${u.trade_stance} |`).join('\n')}

---

## 8. Database Cleanup & Deployment Script Preview
Below is the clean D1 deployment script generated in \`db/latest_week_patch.sql\`:

\`\`\`sql
${patchStatements.join('\n\n')}
\`\`\`
`;

  fs.writeFileSync(verificationDocPath, verificationDocContent, 'utf8');
  fs.writeFileSync(pubFilePath, fullResearchPublication, 'utf8');
  console.log(`💾 Saved Human-Readable Verification Document: docs/VERIFICATION_BRIEFING.md`);
  console.log(`💾 Saved Full Archival Dossier: docs/LATEST_RESEARCH_PUBLICATION.md`);

  // 9. Sync SQLite dump to db/production.sql
  try {
    const dumpSql = execSync(`sqlite3 "${dbPath}" .dump`, { encoding: 'utf8' });
    fs.writeFileSync(path.join(rootDir, 'db', 'production.sql'), dumpSql, 'utf8');
    console.log(`💾 Synced SQLite dump to: db/production.sql`);
  } catch (dumpErr) {
    console.warn(`⚠️ Could not auto-sync production.sql: ${dumpErr.message}`);
  }

  console.log(`\n======================================================`);
  console.log(`✨ DRY-RUN COMPLETED! (NO REMOTE DEPLOYMENT PERFORMED)`);
  console.log(`   Review docs/VERIFICATION_BRIEFING.md for human audit.`);
  console.log(`======================================================\n`);
}

main().catch(err => {
  console.error("FATAL ERROR in dry run:", err);
  process.exit(1);
});
