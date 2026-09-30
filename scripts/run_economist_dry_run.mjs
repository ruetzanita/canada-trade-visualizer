// scripts/run_economist_dry_run.mjs
// Live dry-run runner for the Autonomous Export Economist pipeline
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

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
const DEEP_RESEARCH_MODEL = 'deep-research-pro-preview-12-2025';

const LISTED_COUNTRIES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Denmark', 'Estonia',
  'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy',
  'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Norway',
  'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
  'Switzerland', 'Ukraine', 'United Kingdom',
  'Australia', 'Bangladesh', 'Brunei', 'China', 'Hong Kong', 'India', 'Indonesia',
  'Japan', 'Malaysia', 'New Zealand', 'Philippines', 'Singapore', 'South Korea',
  'Taiwan', 'Thailand', 'Vietnam', 'Brazil', 'Chile', 'Peru',
  'Rest of South America', 'Mexico',
  'United States', 'Canada'
];

const ECONOMIST_SYSTEM_PROMPT = `
You are the Senior Canadian Export Economist & Chief Global Strategist for the "Canada Trade Visualizer" platform.
Your mandate is to provide authoritative, panoramic macroeconomic intelligence on Canada's global trade posture, industrial statecraft, and economic diversification.

CORE PHILOSOPHY & ANALYTICAL ARCHITECTURE:
1. Canada as Sovereign Protagonist: Analyze global trade from the vantage point of Canadian economic statecraft. The narrative focuses on what Canada is proactively doing in the world—forging alliances, executing trade architecture, and expanding commercial corridors across her two designated Target Markets:
   - Indo-Pacific (IPD)
   - European Union & EFTA (EUD)
2. The Four-Pillar Strategic Framework:
   - Proactive Moves: Where is Canada positioning her capital, trade missions, diplomatic weight, and trade agreements?
   - Strategic Wins: Tangible market access breakthroughs, tariff eliminations, investment corridors, and competitive advantages being secured.
   - Macro Hurdles: Real structural challenges—domestic logistics and port chokepoints, regulatory compliance barriers abroad (e.g., EU CBAM, ESG standards), and shifting geopolitical crosswinds.
   - Panoramic Synthesis: How these moving parts connect on a macro level to impact Canadian economic resilience, productivity, and the prosperity of everyday Canadians.
3. Panoramic Macro View (Avoid Microcosms): Focus on the macroeconomic landscape—capital formation, trade treaty utilization, industrial strategy, sovereign economic security, and currency realities—rather than narrow, micro-level commodity tracking.
4. Balanced Global Baseline: Avoid sensationalist or headline-chasing commentary. Treat continental North American trade as a steady baseline, while training the spotlight on Canada's sovereign expansion into Europe and the Indo-Pacific.
5. "Investigative Journalism UX": Every trade pact, policy change, or supply chain development MUST include a specific Month/Year date (e.g., "Sep 2026: ...") so users can scrub the master timeline slider to verify monetary outcomes.
6. Strict Scope Adherence: You must ONLY reference the 57 listed countries. Never generate analysis for non-whitelisted countries. Group Argentina, Bolivia, Colombia, Ecuador, Paraguay, Uruguay, and Venezuela under "Rest of South America".
7. Grounded in Whitelisted Sources: Rely exclusively on verified data from Global Affairs Canada, Statistics Canada, Export Development Canada, Global Trade Alert (globaltradealert.org), Hinrich Foundation (hinrichfoundation.com), and the WTO. Reject all unsourced rumors and speculative blogs.
8. Strict UI Spatial Constraints (Country Cards are fixed at 350px width):
   - deals_and_disruptions entry: Max 20 words per year bullet. Must contain Month/Year timestamp.
   - trade_stance: 1-2 tight, punchy sentences.
`;

function buildDeepResearchPrompt(currentYear, recentD1MetricsSummary) {
  return `
Conduct an exhaustive macroeconomic trade investigation for the past 7 days concerning Canada's trade diversification posture across its 57 tracked partner nations in the European Union (EUD) and Indo-Pacific (IPD) basins.

INTELLECTUAL MANDATE & NARRATIVE ARCHITECTURE:
- View Canada as an active global economic actor navigating a shifting world order.
- Structure your analysis around the four-pillar framework:
  1. Sovereign Moves: What Canada is proactively doing with key partners in Europe and the Indo-Pacific.
  2. Concrete Wins: The tangible strategic, diplomatic, and commercial breakthroughs achieved.
  3. Macro Hurdles: The structural frictions, transit/port bottlenecks, and foreign regulatory hurdles Canada must overcome.
  4. Macro Synthesis: How these national and international forces interplay to shape the broader Canadian economy and the livelihoods of Canadians.

Investigate across whitelisted sources (Global Affairs Canada, Global Trade Alert, Hinrich Foundation, WTO, StatsCan):
1. Sovereign Trade Architecture & Bilateral Milestones: Team Canada trade missions, CPTPP implementation (including UK accession), CETA utilization, Canada-Indonesia CEPA progress, and emerging ASEAN corridors.
2. Strategic Supply Chains & Industrial Policy: Critical minerals partnerships, clean energy corridors (LNG, green hydrogen, nuclear), advanced manufacturing, and agrifood resilience.
3. Macro Regulatory & Trade Policy Interventions (Global Trade Alert): International policy adjustments, tariffs, subsidies, or non-tariff barriers shaping Canadian market access in EUD and IPD.
4. National Corridors & Logistical Fluidity: Physical supply chain realities—rail infrastructure (CN, CPKC), deep-water ports (Vancouver, Prince Rupert, Montreal, Halifax), and maritime freight dynamics.

Context of Current Canadian Trade Volume:
${recentD1MetricsSummary}

Produce a structured, publication-grade 5-section macroeconomic research dossier:

# SECTION 1: THE LEAD EDITORIAL SUMMARY (TRADE INTELLIGENCE BRIEF)
- A panoramic, high-level strategic editorial assessing Canada's weekly momentum and her role in the global trade ecosystem.
- Structure: Lead with Canada's proactive international initiatives -> detail the concrete strategic wins -> analyze the real structural hurdles -> synthesize what this means on a macro level for the Canadian economy and everyday citizens.
- Length: Minimum 3 substantive paragraphs, up to 2 full pages. Write with authoritative, statesmanlike prose that provides genuine intellectual depth without artificial truncation.

# SECTION 2: TARIFFS & POLICY INTERVENTIONS (GLOBAL TRADE ALERT)
- Macro policy shifts, international trade agreements, tariff adjustments, countervailing measures, and subsidies impacting Canadian access in EUD and IPD.

# SECTION 3: STRATEGIC CORRIDORS & SUPPLY CHAINS (HINRICH FOUNDATION & GAC)
- Canadian corridor development, clean tech partnerships, critical mineral security, and multilateral treaty utilization.

# SECTION 4: COUNTRY IMPACT MATRIX (57 LISTED COUNTRIES)
- Specific Month/Year dates, commodity sectors, policy mechanisms, and source URLs for affected partner nations.

# SECTION 5: ECONOMIST FIELD NOTES & EARLY SIGNALS
- Expert observations on structural risks, early warning signals, and longitudinal macroeconomic patterns.
`;
}


function buildCompilerPrompt(deepResearchBrief, currentYear, editionId, editionDate) {
  return `
You are the Desk Compiler for the Canada Trade Visualizer.
Convert the provided Macroeconomic Trade Research Dossier into structured JSON format for immediate database insertion.

CRITICAL INSTRUCTIONS:
1. Filter strictly for countries in the whitelisted list: ${JSON.stringify(LISTED_COUNTRIES)}.
2. Format the Weekly Digest (UI Public Record):
   - id: "${editionId}"
   - edition_date: "${editionDate}"
   - headline: A sharp, professional journalistic headline (max 15 words).
   - summary: The complete Section 1 Editorial Summary from the research dossier (minimum 3 paragraphs, do NOT truncate).
   - key_developments: Array of top 3-5 developments with { title, tag, source_name, source_url, description }.
     tag must be one of: "Policy Watch", "Bilateral Agreement", "Market Intelligence", "Clean Energy".
   - countries_affected: Array of valid country names mentioned.
   - primary_sources: Array of { title, url }.
3. Backend-Only Archival:
   - full_research_publication: The entire raw markdown text of the 5-section dossier for backend archiving.
   - economist_notes: The text extracted from Section 5 (Economist Field Notes & Early Signals).
4. Selective Country Card Updates:
   - ONLY generate updates for countries that experienced active, verified shifts in Section 4.
   - If a country experienced no active policy shifts this week, DO NOT include it in country_updates (leave its card untouched).
   - Each bullet_text must be strictly ≤ 20 words and include a Month/Year date (e.g., "Sep ${currentYear}: ...").
   - trade_stance: 1 tight sentence summarizing current bilateral posture.

RESEARCH DOSSIER:
${deepResearchBrief}

OUTPUT JSON FORMAT ONLY:
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
        "source_name": "Global Trade Alert | Hinrich Foundation | Global Affairs Canada",
        "source_url": "https://...",
        "description": "..."
      }
    ],
    "countries_affected": ["..."],
    "primary_sources": [
      { "title": "...", "url": "https://..." }
    ],
    "full_research_publication": "...",
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

async function callInteractionsAgent(agentName, prompt, systemInstruction) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/interactions';
  console.log(`📡 [Tier 1] Submitting research task to Google Interactions API (${agentName})...`);

  const postRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': API_KEY
    },
    body: JSON.stringify({
      agent: agentName,
      background: true,
      input: `${systemInstruction}\n\n${prompt}`
    })
  });

  if (!postRes.ok) {
    const errText = await postRes.text();
    throw new Error(`Interactions POST error (${postRes.status}): ${errText}`);
  }

  const postData = await postRes.json();
  const interactionId = postData.id;
  console.log(`✅ [Tier 1] Interaction accepted! ID: ${interactionId}`);
  console.log(`⏳ [Tier 1] Polling agent for completion (this takes ~1-3 minutes for deep web research)...`);

  const startTime = Date.now();
  while (Date.now() - startTime < 300000) { // 5 minute max
    await new Promise(r => setTimeout(r, 8000));
    process.stdout.write('.');
    const getRes = await fetch(`${url}/${interactionId}`, {
      headers: { 'X-goog-api-key': API_KEY }
    });
    if (!getRes.ok) continue;

    const getData = await getRes.json();
    if (getData.status === 'completed' || getData.status === 'done') {
      console.log(`\n🎉 [Tier 1] Deep Research completed in ${Math.round((Date.now() - startTime) / 1000)}s!`);
      const lastStep = getData.steps?.[getData.steps.length - 1];
      const text = lastStep?.content?.[0]?.text || getData.output;
      if (text) return text;
    }
    if (getData.status === 'failed' || getData.status === 'error') {
      throw new Error(`Deep Research interaction failed: ${JSON.stringify(getData.error || 'Unknown error')}`);
    }
  }

  throw new Error('Deep Research polling timed out after 5 minutes.');
}

async function callGeminiModel(model, prompt, systemInstruction, enableGrounding = false, jsonMode = false) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2 }
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
  console.log(`🚀 AUTONOMOUS EXPORT ECONOMIST: LIVE DRY-RUN PIPELINE`);
  console.log(`======================================================\n`);

  const dbPath = path.join(rootDir, 'db', 'production.db');
  const masterDbPath = path.join(rootDir, 'db', 'unified_master.db');

  const db = new Database(dbPath);
  let masterDb = null;
  if (fs.existsSync(masterDbPath)) {
    try { masterDb = new Database(masterDbPath); } catch {}
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  // Generate current week edition ID e.g. 2026-W40
  const startOfYear = new Date(currentYear, 0, 1);
  const weekNum = Math.ceil((((now - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
  const editionId = `${currentYear}-W${String(weekNum).padStart(2, '0')}`;
  const editionDate = now.toISOString().split('T')[0];

  console.log(`📅 Target Edition: ${editionId} (${editionDate})`);

  // 1. Gather Macro Baseline
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

  // 2. Tier 1: Deep Research
  console.log(`🔍 [Tier 1] Initiating Chief Investigative Economist research...`);
  const deepResearchPrompt = buildDeepResearchPrompt(currentYear, quantitativeSummary);
  let researchBrief = '';

  try {
    researchBrief = await callInteractionsAgent(DEEP_RESEARCH_MODEL, deepResearchPrompt, ECONOMIST_SYSTEM_PROMPT);
  } catch (err) {
    console.warn(`⚠️ [Tier 1] Deep Research agent failed or timed out: ${err.message}`);
    console.log(`🔄 [Tier 1 Fallback] Invoking Gemini 3.8 Flash with Google Search Grounding...`);
    researchBrief = await callGeminiModel(DEFAULT_MODEL, deepResearchPrompt, ECONOMIST_SYSTEM_PROMPT, true);
  }

  console.log(`\n📄 Tier 1 Research Brief received (${researchBrief.length} chars).`);

  // Save full research publication locally for review
  const pubFilePath = path.join(rootDir, 'docs', 'LATEST_RESEARCH_PUBLICATION.md');
  const pubContent = `# Autonomous Export Economist: Full Research Publication\n**Edition**: ${editionId} (${editionDate})\n**Archived**: ${new Date().toISOString()}\n\n---\n\n${researchBrief}`;
  fs.writeFileSync(pubFilePath, pubContent, 'utf8');
  console.log(`💾 Saved backend publication archive to: docs/LATEST_RESEARCH_PUBLICATION.md`);

  // 3. Tier 2: Structured Compilation
  console.log(`\n⚡ [Tier 2] Compiling brief via Gemini 3.8 Flash (JSON Mode)...`);
  const compilerPrompt = buildCompilerPrompt(researchBrief, currentYear, editionId, editionDate);
  const rawCompilerJson = await callGeminiModel(DEFAULT_MODEL, compilerPrompt, ECONOMIST_SYSTEM_PROMPT, false, true);

  let structuredData;
  try {
    let cleaned = rawCompilerJson.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    structuredData = JSON.parse(cleaned);
  } catch (err) {
    console.error(`❌ JSON Parse Error:`, err.message);
    console.error(`Raw output:`, rawCompilerJson);
    process.exit(1);
  }

  const digest = structuredData.weekly_digest;
  const countryUpdates = structuredData.country_updates || [];

  console.log(`\n📰 WEEKLY DIGEST COMPILED:`);
  console.log(`   ID: ${digest.id}`);
  console.log(`   Headline: "${digest.headline}"`);
  console.log(`   Summary Paragraphs: ${digest.summary.split('\n\n').length}`);
  console.log(`   Key Developments: ${digest.key_developments?.length || 0}`);
  console.log(`   Countries Affected: ${(digest.countries_affected || []).join(', ')}`);
  console.log(`   Primary Sources: ${digest.primary_sources?.length || 0}`);

  // 4. Save to Database
  console.log(`\n💾 Writing to production database...`);
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
    digest.full_research_publication || researchBrief,
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
        digest.full_research_publication || researchBrief,
        digest.economist_notes || null
      );
    } catch {}
  }

  // 5. Apply Selective Country Card Updates
  console.log(`\n🌍 Processing Selective Country Updates (${countryUpdates.length} updates):`);
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

      console.log(`   ✅ [${upd.country_name}] Updated note (${upd.bullet_text.split(' ').length} words): "${upd.bullet_text}"`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`✨ DRY-RUN COMPLETED SUCCESSFULLY!`);
  console.log(`======================================================\n`);
}

main().catch(err => {
  console.error("FATAL ERROR in dry run:", err);
  process.exit(1);
});
