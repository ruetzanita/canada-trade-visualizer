// workers/economist-agent/src/index.ts
import { GeminiService } from './gemini';
import {
  ECONOMIST_SYSTEM_PROMPT,
  LISTED_COUNTRIES,
  buildDeepResearchPrompt,
  buildCompilerPrompt
} from './prompts';

export interface Env {
  DB: any; // Cloudflare D1 Database binding
  GEMINI_API_KEY: string;
  DEFAULT_MODEL?: string;
  DEEP_RESEARCH_MODEL?: string;
  ADMIN_TOKEN?: string;
}

async function runEconomistPipeline(env: Env): Promise<{ success: boolean; digestId: string; updatedCountries: string[] }> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY secret is required in Worker environment context!");
  }
  if (!env.DB) {
    throw new Error("Cloudflare D1 database binding 'DB' is missing!");
  }

  const gemini = new GeminiService({
    apiKey: env.GEMINI_API_KEY,
    defaultModel: env.DEFAULT_MODEL || 'gemini-3.8-flash',
    deepResearchModel: env.DEEP_RESEARCH_MODEL || 'deep-research-pro-preview'
  });

  const now = new Date();
  const currentYear = now.getFullYear();

  // 1. Fetch recent macro trade volume baseline from D1
  const recentRows = await env.DB.prepare(`
    SELECT 
      c.country_name,
      SUM(r.total_export_value_cad) as total_val
    FROM macro_monthly_summary r
    JOIN countries c ON r.country_code = c.country_code
    WHERE SUBSTR(CAST(r.report_month AS TEXT), 1, 4) = ?
    GROUP BY c.country_name
    ORDER BY total_val DESC
    LIMIT 15
  `).bind(currentYear.toString()).all();

  const quantitativeSummary = (recentRows?.results || [])
    .map((r: any) => `${r.country_name}: CAD $${(Number(r.total_val) / 1000000).toFixed(1)}M`)
    .join(', ');

  // 2. Tier 1: Conduct Deep Macroeconomic Research
  const deepResearchPrompt = buildDeepResearchPrompt(currentYear, quantitativeSummary);
  const researchBrief = await gemini.generateResearchBrief(deepResearchPrompt, ECONOMIST_SYSTEM_PROMPT);

  // 3. Tier 2: Compile Brief into Structured Database Records
  const compilerPrompt = buildCompilerPrompt(researchBrief, currentYear);
  const structuredData = await gemini.compileStructuredOutput(compilerPrompt, ECONOMIST_SYSTEM_PROMPT);

  const digest = structuredData.weekly_digest;
  const countryUpdates = structuredData.country_updates || [];

  if (!digest || !digest.id) {
    throw new Error("Compiler failed to produce a valid weekly_digest payload.");
  }

  // 4. Save Weekly Digest into D1 `weekly_digests` (Archiving full publication in backend)
  await env.DB.prepare(`
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
  `).bind(
    digest.id,
    digest.edition_date,
    digest.headline,
    digest.summary,
    JSON.stringify(digest.key_developments || []),
    JSON.stringify(digest.countries_affected || []),
    JSON.stringify(digest.primary_sources || []),
    digest.full_research_publication || researchBrief || null,
    digest.economist_notes || null
  ).run();

  console.log(`[EconomistAgent] Successfully upserted weekly digest: ${digest.id}`);

  // 5. Update Affected Country Cards in D1 `country_context`
  const updatedCountryNames: string[] = [];

  for (const update of countryUpdates) {
    const cName = update.country_name;
    // Strict whitelist check
    if (!LISTED_COUNTRIES.includes(cName as any)) {
      console.warn(`[EconomistAgent] Skipping unlisted country: ${cName}`);
      continue;
    }

    const row = await env.DB.prepare(`
      SELECT deals_and_disruptions, trade_stance FROM country_context WHERE country_name = ?
    `).bind(cName).first();

    if (row) {
      let dealsObj: Record<string, string> = {};
      try {
        dealsObj = JSON.parse(row.deals_and_disruptions || '{}');
      } catch {
        dealsObj = {};
      }

      // Update or append note for the target year
      const yearKey = String(update.year || currentYear);
      dealsObj[yearKey] = update.bullet_text;

      const newStance = update.trade_stance || row.trade_stance;

      await env.DB.prepare(`
        UPDATE country_context 
        SET 
          deals_and_disruptions = ?,
          trade_stance = ?,
          last_updated_at = CURRENT_TIMESTAMP
        WHERE country_name = ?
      `).bind(JSON.stringify(dealsObj), newStance, cName).run();

      updatedCountryNames.push(cName);
      console.log(`[EconomistAgent] Updated country card: ${cName} for year ${yearKey}`);
    }
  }

  return {
    success: true,
    digestId: digest.id,
    updatedCountries: updatedCountryNames
  };
}

export default {
  // Scheduled Trigger: Executes every Sunday via Cloudflare Cron
  async scheduled(event: any, env: Env, ctx: any) {
    ctx.waitUntil(
      runEconomistPipeline(env)
        .then(res => console.log(`[EconomistAgent] Sunday cron completed:`, res))
        .catch(err => console.error(`[EconomistAgent] Sunday cron failed:`, err))
    );
  },

  // HTTP Fetch Trigger: Allows manual execution & health checks
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'trade-economist-agent' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/run' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      if (!env.ADMIN_TOKEN || authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Valid ADMIN_TOKEN Bearer authorization is required.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const result = await runEconomistPipeline(env);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response("Canada Trade Economist Agent Worker is active.", { status: 200 });
  }
};
