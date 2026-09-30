import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const rootDir = process.cwd();
const dbPath = path.join(rootDir, 'db', 'production.db');

let currentDb: any = null;
let currentDbMtime = 0;

function getDb() {
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Production database not found at ${dbPath}`);
  }
  const stat = fs.statSync(dbPath);
  if (!currentDb || stat.mtimeMs !== currentDbMtime) {
    if (currentDb) {
      try { currentDb.close(); } catch {}
    }
    currentDb = new Database(dbPath, { readonly: true });
    currentDbMtime = stat.mtimeMs;
  }
  return currentDb;
}

function parseRow(r: any) {
  if (!r) return null;
  return {
    id: r.id,
    edition_date: r.edition_date,
    headline: r.headline,
    summary: r.summary,
    key_developments: typeof r.key_developments === 'string' ? JSON.parse(r.key_developments) : (r.key_developments || []),
    countries_affected: typeof r.countries_affected === 'string' ? JSON.parse(r.countries_affected) : (r.countries_affected || []),
    primary_sources: typeof r.primary_sources === 'string' ? JSON.parse(r.primary_sources) : (r.primary_sources || []),
    created_at: r.created_at
  };
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const specificId = searchParams.get('id');
    const getAll = searchParams.get('all') === 'true';

    if (specificId) {
      const row = db.prepare('SELECT * FROM weekly_digests WHERE id = ? LIMIT 1').get(specificId);
      if (!row) {
        return NextResponse.json({ success: false, error: 'Digest not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, digest: parseRow(row) });
    }

    if (getAll) {
      const rows = db.prepare('SELECT * FROM weekly_digests ORDER BY edition_date DESC LIMIT 52').all();
      return NextResponse.json({ success: true, digests: rows.map(parseRow) });
    }

    const row = db.prepare('SELECT * FROM weekly_digests ORDER BY edition_date DESC LIMIT 1').get();
    return NextResponse.json({ success: true, digest: parseRow(row) });
  } catch (err: any) {
    console.error('Digest API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
