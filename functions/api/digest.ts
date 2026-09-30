// Cloudflare Pages Function: /api/digest
// Returns autonomous Trade Intelligence entries from D1

async function executeQuery(db: any, sql: string, args: any[] = []) {
  const stmt = db.prepare(sql);
  const result = args.length > 0 ? await stmt.bind(...args).all() : await stmt.all();
  if (Array.isArray(result?.results)) return result.results;
  if (Array.isArray(result)) return result;
  return [];
}

function parseDigestRow(r: any, includePublication: boolean = false) {
  if (!r) return null;
  const res: any = {
    id: r.id,
    edition_date: r.edition_date,
    headline: r.headline,
    summary: r.summary,
    key_developments: typeof r.key_developments === 'string' ? JSON.parse(r.key_developments) : (r.key_developments || []),
    countries_affected: typeof r.countries_affected === 'string' ? JSON.parse(r.countries_affected) : (r.countries_affected || []),
    primary_sources: typeof r.primary_sources === 'string' ? JSON.parse(r.primary_sources) : (r.primary_sources || []),
    created_at: r.created_at
  };
  if (includePublication) {
    res.full_research_publication = r.full_research_publication;
    res.economist_notes = r.economist_notes;
  }
  return res;
}

export async function onRequest(context: any) {
  const { request, env } = context;

  try {
    const d1Db = env.DB;
    if (!d1Db) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Cloudflare D1 Database binding 'DB' not found in environment context!" 
      }), {
        status: 500,
        headers: { 
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const { searchParams } = new URL(request.url);
    const getAll = searchParams.get('all') === 'true';
    const specificId = searchParams.get('id');
    const includePublication = searchParams.get('include_publication') === 'true';

    if (specificId) {
      const rows = await executeQuery(d1Db, `SELECT * FROM weekly_digests WHERE id = ? LIMIT 1`, [specificId]);
      if (!rows || rows.length === 0) {
        return new Response(JSON.stringify({ success: false, error: `Digest '${specificId}' not found.` }), {
          status: 404,
          headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      return new Response(JSON.stringify({ success: true, digest: parseDigestRow(rows[0], includePublication) }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (getAll) {
      const rows = await executeQuery(d1Db, `SELECT id, edition_date, headline FROM weekly_digests ORDER BY edition_date DESC LIMIT 52`);
      return new Response(JSON.stringify({ success: true, editions: rows || [] }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Default: Return latest digest
    const rows = await executeQuery(d1Db, `SELECT * FROM weekly_digests ORDER BY edition_date DESC LIMIT 1`);
    const latest = rows && rows.length > 0 ? parseDigestRow(rows[0], includePublication) : null;

    return new Response(JSON.stringify({ success: true, digest: latest }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error && error.message ? error.message : "Unknown error in /api/digest" 
    }), {
      status: 500,
      headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
