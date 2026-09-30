import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const prodDbPath = path.join(rootDir, 'db', 'production.db');
const masterDbPath = path.join(rootDir, 'db', 'unified_master.db');

const eudData = JSON.parse(fs.readFileSync(path.join(rootDir, 'db', 'EUD_country_data.json'), 'utf8'));
const ipdData = JSON.parse(fs.readFileSync(path.join(rootDir, 'db', 'IPD_country_data.json'), 'utf8'));

const COUNTRY_CODE_OVERRIDES = {
  'Rest of South America': 'ROSA',
  'United Kingdom': 'GB',
  'United States': 'US'
};

const migrationSql = fs.readFileSync(
  path.join(rootDir, 'db', 'migrations', '0001_add_qualitative_and_digest_tables.sql'),
  'utf8'
);

function applyMigrationAndSeed(dbPath, isMaster = false) {
  if (!fs.existsSync(dbPath)) {
    console.log(`Skipping ${dbPath} (file does not exist)`);
    return;
  }

  console.log(`\n📦 Applying migration and seeding to: ${dbPath}`);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // 1. Run Schema Migration
  db.exec(migrationSql);
  try { db.exec("ALTER TABLE weekly_digests ADD COLUMN full_research_publication TEXT;"); } catch {}
  try { db.exec("ALTER TABLE weekly_digests ADD COLUMN economist_notes TEXT;"); } catch {}
  console.log('✓ Migration tables ensured: country_context, weekly_digests');

  // Build country code lookup
  const countries = db.prepare('SELECT country_code, country_name, region FROM countries').all();
  const nameToCodeMap = new Map();
  for (const c of countries) {
    nameToCodeMap.set(c.country_name, c.country_code);
  }

  const upsertContextStmt = db.prepare(`
    INSERT INTO country_context (
      country_name,
      country_code,
      region,
      historical_background,
      top_5_commodities,
      trade_stance,
      deals_and_disruptions,
      source_link,
      last_updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(country_name) DO UPDATE SET
      country_code = excluded.country_code,
      region = excluded.region,
      historical_background = excluded.historical_background,
      top_5_commodities = excluded.top_5_commodities,
      trade_stance = excluded.trade_stance,
      deals_and_disruptions = excluded.deals_and_disruptions,
      source_link = excluded.source_link,
      last_updated_at = CURRENT_TIMESTAMP
  `);

  let count = 0;

  // Insert EUD countries
  for (const [name, data] of Object.entries(eudData)) {
    const code = COUNTRY_CODE_OVERRIDES[name] || nameToCodeMap.get(name) || 'EU';
    upsertContextStmt.run(
      name,
      code,
      'EUD',
      data.historical_background,
      JSON.stringify(data.top_5_commodities || []),
      data.trade_stance || '',
      JSON.stringify(data.deals_and_disruptions || {}),
      data.source_link || 'https://www.international.gc.ca'
    );
    count++;
  }

  // Insert IPD countries
  for (const [name, data] of Object.entries(ipdData)) {
    const code = COUNTRY_CODE_OVERRIDES[name] || nameToCodeMap.get(name) || 'IP';
    upsertContextStmt.run(
      name,
      code,
      'IPD',
      data.historical_background,
      JSON.stringify(data.top_5_commodities || []),
      data.trade_stance || '',
      JSON.stringify(data.deals_and_disruptions || {}),
      data.source_link || 'https://www.international.gc.ca'
    );
    count++;
  }

  console.log(`✓ Seeded ${count} country context profiles into country_context`);

  // Seed Weekly Digests (Current W39 + Prior W38 for historical testing)
  const editions = [
    {
      id: '2026-W39',
      edition_date: '2026-09-27',
      headline: 'Indo-Pacific Supply Pivot Deepens as Critical Minerals & Agri-Food Anchor Canadian Resilience',
      summary: `As global macroeconomic trade realignments accelerate into the final quarter of 2026, Canada's strategic push to diversify exports beyond traditional North American corridors is showing structural resilience. In particular, non-US shipments across the Indo-Pacific and European Union basins continue to outpace historical quarterly baselines, heavily anchored by persistent international demand for Canadian agricultural staples, fertilizer potash, and strategic transition minerals.

High-frequency monitoring through the Global Trade Alert data center highlights a pronounced uptick in subtle non-tariff frictions across industrial manufacturing, as major trading blocs recalibrate domestic carbon and critical raw material frameworks. Brussels has tightened compliance reporting under CETA sustainability clauses, creating operational hurdles for non-aligned third parties while providing Canadian nickel, cobalt, and lithium exporters with a distinct compliance advantage in European battery supply chains.

Concurrently, findings from the Hinrich Foundation's Sustainable Trade monitoring reflect shifting energy security calculations across East Asia. The operationalization of the Canada-Indonesia CEPA framework alongside commercial hydrogen shipments to northern Germany validates a multi-year pivot toward binding, bilateral supply architectures. For Canadian producers, these institutional corridors serve as an indispensable macroeconomic buffer against fluctuating global commodity cycles.`,
      key_developments: JSON.stringify([
        {
          title: 'Canada-Indonesia CEPA Implementation Accelerates',
          tag: 'Bilateral Agreement',
          source_name: 'Global Affairs Canada',
          source_url: 'https://www.international.gc.ca/country-pays/indonesia-indonesie/relations.aspx?lang=eng',
          description: 'Tariff elimination schedules for Canadian milling wheat, pulses, and mining machinery took operational effect this month, bolstering Southeast Asian agricultural market share.'
        },
        {
          title: 'Global Trade Alert: EU Critical Raw Materials Regulatory Phasing',
          tag: 'Policy Watch',
          source_name: 'Global Trade Alert',
          source_url: 'https://globaltradealert.org/data-center',
          description: 'New ESG transparency certifications for imported lithium, nickel, and cobalt were finalized in Brussels, favoring established Canadian CETA-compliant mining supply chains over non-aligned exporters.'
        },
        {
          title: 'Hinrich Foundation Sustainable Trade Index: Asia-Pacific Clean Energy Corridors',
          tag: 'Market Intelligence',
          source_name: 'Hinrich Foundation',
          source_url: 'https://www.hinrichfoundation.com/',
          description: 'Analysis highlights Canadian hydrogen and LNG infrastructure developments along the Pacific coast as vital stabilizing hedges for South Korean and Japanese energy security strategies.'
        },
        {
          title: 'Germany Hydrogen Alliance Commercial Shipments Initiated',
          tag: 'Clean Energy',
          source_name: 'Natural Resources Canada',
          source_url: 'https://www.international.gc.ca/country-pays/germany-allemagne/relations.aspx?lang=eng',
          description: 'The transatlantic green ammonia and hydrogen export corridor recorded its first commercial-scale delivery, validating multi-year bilateral infrastructure investments.'
        }
      ]),
      countries_affected: JSON.stringify(['Indonesia', 'Germany', 'South Korea', 'Japan', 'France']),
      primary_sources: JSON.stringify([
        { title: 'Global Affairs Canada - Bilateral Trade Strategy', url: 'https://www.international.gc.ca' },
        { title: 'Global Trade Alert - Trade Intervention Data Center', url: 'https://globaltradealert.org/data-center' },
        { title: 'Hinrich Foundation - Sustainable Trade & Supply Chain Research', url: 'https://www.hinrichfoundation.com/' }
      ]),
      full_research_publication: `# CANADIAN EXPORT ECONOMIST WEEKLY DOSSIER: 2026-W39
Compiled via Deep Research Pro Preview (GTA, Hinrich, GAC, WTO).
Archived backend-only for longitudinal pattern analysis.

## SECTION 1: EDITORIAL SUMMARY
Canada's trade diversification posture remains robust into Q4 2026...

## SECTION 2: TARIFFS & POLICY INTERVENTIONS (GTA)
- GTA-2026-0922: EU Critical Raw Materials verification requirements finalized.
- GTA-2026-0918: Southeast Asian agricultural customs standardization.

## SECTION 3: STRATEGIC CORRIDORS (HINRICH & GAC)
- Hinrich Sustainable Trade Index confirms high alignment for Canadian Pacific LNG & green ammonia.
- GAC Team Canada ministerial itinerary confirmed for ASEAN hubs.

## SECTION 4: COUNTRY IMPACT MATRIX
- Indonesia: CEPA tariff reduction phase 1 active.
- Germany: Green ammonia commercial off-take commenced.
- Japan: Metallurgical coal and canola volumes stable.

## SECTION 5: ECONOMIST FIELD NOTES
- Monitor non-tariff port congestion indices along European northern gateways.
- Early signal: Indian pulse tariff review expected in late November.`,
      economist_notes: `Field Notes 2026-W39: Monitor Indian pulse tariff discussions slated for late November; watch for potential secondary impacts on Saskatchewan lentil shipments. European port inspections increasing on bio-fertilizer imports.`
    },
    {
      id: '2026-W38',
      edition_date: '2026-09-20',
      headline: 'Transpacific Corridors Expand as ASEAN Bilateral Talks Reach Advanced Stages',
      summary: `Early autumn trade data confirms expanding momentum across Western Canadian maritime gateways, with outbound cargo toward Southeast Asia recording significant year-over-year gains in grain and potash volumes. The diversification thrust prioritized under Canada's Indo-Pacific Strategy is yielding tangible market share gains, counterbalancing temporary cooling in select European capital goods orders.

Policy measures logged by Global Trade Alert indicate an increasingly competitive tariff landscape for agricultural inputs across South and Southeast Asia. Canadian exporters have maintained price competitiveness through direct long-term supply agreements with state buyers in Bangladesh, Indonesia, and the Philippines, bypassing intermediary spot-market volatility.

Looking ahead, trade missions coordinated through the Trade Commissioner Service are focusing on high-tech aerospace components and nuclear-grade uranium deliveries. As allied partners emphasize resilient supply chains, Canada's geopolitical alignment continues to serve as an economic asset in securing long-term export contracts.`,
      key_developments: JSON.stringify([
        {
          title: 'Canada-Philippines Bilateral Food Security Dialogue',
          tag: 'Bilateral Agreement',
          source_name: 'Global Affairs Canada',
          source_url: 'https://www.international.gc.ca',
          description: 'Manila and Ottawa advanced technical talks on agricultural SPS measures, ensuring uninterrupted flow of Canadian pork and grain.'
        },
        {
          title: 'Hinrich Foundation Report: Supply Chain Nearshoring Trajectories',
          tag: 'Market Intelligence',
          source_name: 'Hinrich Foundation',
          source_url: 'https://www.hinrichfoundation.com/',
          description: 'Research indicates shifting supply lines benefit Canadian resource suppliers as Asian manufacturing hubs diversify sourcing away from centralized dependencies.'
        }
      ]),
      countries_affected: JSON.stringify(['Philippines', 'Indonesia', 'Bangladesh', 'India']),
      primary_sources: JSON.stringify([
        { title: 'Global Affairs Canada - Indo-Pacific Strategy', url: 'https://www.international.gc.ca' },
        { title: 'Hinrich Foundation - Supply Chain Research', url: 'https://www.hinrichfoundation.com/' }
      ]),
      full_research_publication: `# CANADIAN EXPORT ECONOMIST WEEKLY DOSSIER: 2026-W38
Archived backend-only for longitudinal pattern analysis.
## SECTION 1: EDITORIAL SUMMARY
Transpacific agricultural flows remain dominant...`,
      economist_notes: `Field Notes 2026-W38: Prairie rail capacity operating at 94% efficiency; monitor potential autumn weather bottlenecks.`
    }
  ];

  const upsertDigestStmt = db.prepare(`
    INSERT INTO weekly_digests (
      id,
      edition_date,
      headline,
      summary,
      key_developments,
      countries_affected,
      primary_sources,
      full_research_publication,
      economist_notes,
      created_at
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

  for (const ed of editions) {
    upsertDigestStmt.run(
      ed.id,
      ed.edition_date,
      ed.headline,
      ed.summary,
      ed.key_developments,
      ed.countries_affected,
      ed.primary_sources,
      ed.full_research_publication,
      ed.economist_notes
    );
    console.log(`✓ Seeded Weekly Digest edition: ${ed.id} (${ed.edition_date})`);
  }
  db.close();
}

applyMigrationAndSeed(prodDbPath);
applyMigrationAndSeed(masterDbPath, true);
console.log('\n✨ Database migration and seeding completed successfully!');
