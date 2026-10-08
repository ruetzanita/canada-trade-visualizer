#!/usr/bin/env node

/**
 * Canada Trade Visualizer: Cloudflare D1 Deployment Utility
 * 
 * Provides automated and manual deployment capabilities to synchronize
 * local database patches or full database dumps directly with Cloudflare D1.
 * 
 * Usage:
 *   node scripts/deploy_d1.mjs                # Deploys db/latest_week_patch.sql
 *   node scripts/deploy_d1.mjs --full         # Deploys full db/production.sql
 *   node scripts/deploy_d1.mjs --file=path    # Deploys specific SQL file
 *   node scripts/deploy_d1.mjs --dry-run      # Validates setup without executing
 *   node scripts/deploy_d1.mjs --verify       # Queries remote D1 to verify latest entry
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DB_BINDING_NAME = 'trade-dashboard-db';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    file: null,
    full: false,
    dryRun: false,
    verifyOnly: false
  };

  for (const arg of args) {
    if (arg === '--full') {
      options.full = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--verify') {
      options.verifyOnly = true;
    } else if (arg.startsWith('--file=')) {
      options.file = arg.split('=')[1];
    }
  }

  return options;
}

function checkWrangler() {
  const result = spawnSync('npx', ['--yes', 'wrangler', '--version'], {
    cwd: rootDir,
    encoding: 'utf8',
    shell: true
  });

  if (result.status !== 0) {
    console.error('❌ Error: Wrangler CLI is not available.');
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }

  const version = (result.stdout || '').trim();
  console.log(`🔧 Cloudflare Wrangler CLI ready (${version})`);
}

function verifyRemoteD1() {
  console.log(`\n🔍 Verifying latest state in Cloudflare D1 (${DB_BINDING_NAME})...`);
  const digestQueryCmd = `npx --yes wrangler d1 execute ${DB_BINDING_NAME} --remote --command="SELECT id, edition_date, headline FROM weekly_digests ORDER BY id DESC LIMIT 3;" --json`;
  const macroQueryCmd = `npx --yes wrangler d1 execute ${DB_BINDING_NAME} --remote --command="SELECT MIN(report_month) as min_m, MAX(report_month) as max_m, COUNT(*) as cnt FROM macro_monthly_summary;" --json`;
  
  try {
    const digestOutput = execSync(digestQueryCmd, {
      cwd: rootDir,
      encoding: 'utf8',
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const parsedDigest = JSON.parse(digestOutput);
    const digestResults = parsedDigest?.[0]?.results || [];
    if (digestResults.length > 0) {
      console.log('📊 Active remote editions in D1:');
      for (const row of digestResults) {
        console.log(`   • [${row.id}] (${row.edition_date}): ${row.headline}`);
      }
    } else {
      console.log('ℹ️ No weekly digests found in remote D1.');
    }

    const macroOutput = execSync(macroQueryCmd, {
      cwd: rootDir,
      encoding: 'utf8',
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const parsedMacro = JSON.parse(macroOutput);
    const macroRow = parsedMacro?.[0]?.results?.[0];
    if (macroRow) {
      console.log(`📈 Quantitative Macro Summaries: min_month=${macroRow.min_m}, max_month=${macroRow.max_m}, total_records=${macroRow.cnt}`);
    }
  } catch (err) {
    console.warn(`⚠️ Could not query remote D1 verification: ${err.message}`);
  }
}

async function main() {
  const options = parseArgs();

  console.log('======================================================');
  console.log('🚀 CLOUDFLARE D1 DEPLOYMENT MANAGER');
  console.log('======================================================');
  console.log(`Target Database: ${DB_BINDING_NAME}`);

  if (options.verifyOnly) {
    checkWrangler();
    verifyRemoteD1();
    return;
  }

  // Determine SQL target file
  let targetSqlPath;
  if (options.file) {
    targetSqlPath = path.isAbsolute(options.file) ? options.file : path.join(rootDir, options.file);
  } else if (options.full) {
    targetSqlPath = path.join(rootDir, 'db', 'production.sql');
  } else {
    targetSqlPath = path.join(rootDir, 'db', 'latest_week_patch.sql');
  }

  if (!fs.existsSync(targetSqlPath)) {
    console.error(`\n❌ Target SQL file not found: ${path.relative(rootDir, targetSqlPath)}`);
    if (!options.file && !options.full) {
      console.error(`   Tip: Generate the latest patch first via:`);
      console.error(`        node scripts/run_economist_dry_run.mjs --compile-only`);
      console.error(`   Or deploy the full database dump via:`);
      console.error(`        node scripts/deploy_d1.mjs --full`);
    }
    process.exit(1);
  }

  const stats = fs.statSync(targetSqlPath);
  const relativeTarget = path.relative(rootDir, targetSqlPath);
  console.log(`Target SQL File: ${relativeTarget} (${(stats.size / 1024).toFixed(1)} KB)`);

  if (options.dryRun) {
    console.log('\n[Dry-Run Mode] Validation passed. Would execute:');
    console.log(`   npx wrangler d1 execute ${DB_BINDING_NAME} --remote --file="${relativeTarget}" --yes`);
    return;
  }

  checkWrangler();

  console.log(`\n📡 Executing SQL deployment against remote D1...`);
  const deployCmd = `npx --yes wrangler d1 execute ${DB_BINDING_NAME} --remote --file="${targetSqlPath}" --yes`;

  try {
    const deployOutput = execSync(deployCmd, {
      cwd: rootDir,
      encoding: 'utf8',
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    console.log(deployOutput);
    console.log(`\n✅ Remote D1 deployment completed successfully!`);

    // Verify after deployment
    verifyRemoteD1();

  } catch (err) {
    console.error(`\n❌ Deployment failed with error:`);
    console.error(err.stderr || err.stdout || err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error during deployment:', err);
  process.exit(1);
});
