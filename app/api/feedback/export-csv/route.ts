import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feedback/export-csv
 * Export raw feedback as CSV
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const region = searchParams.get('region') || 'all';
    const store_id = searchParams.get('store_id') || 'all';
    const sentiment = searchParams.get('sentiment') || 'all';
    const q = searchParams.get('q') || '';
    const order = searchParams.get('order') || 'submitted_at_desc';
    
    const pool = await getDb();
    
    // Build WHERE clause (same as raw endpoint)
    let whereClause = '1=1';
    const params: any = {};
    
    if (start) {
      whereClause += ' AND created_at >= @start';
      params.start = start;
    }
    
    if (end) {
      whereClause += ' AND created_at < DATEADD(day, 1, @end)';
      params.end = end;
    }
    
    if (region !== 'all') {
      whereClause += ' AND region_code = @region';
      params.region = region;
    }
    
    if (store_id !== 'all' && store_id) {
      whereClause += ' AND store_id = @store_id';
      params.store_id = store_id;
    }
    
    if (sentiment !== 'all') {
      whereClause += ' AND overall_mood = @sentiment';
      params.sentiment = sentiment;
    }
    
    if (q.trim()) {
      whereClause += ` AND (
        top_positive LIKE '%' + @search + '%' OR
        top_negative_1 LIKE '%' + @search + '%' OR
        top_negative_2 LIKE '%' + @search + '%' OR
        top_negative_3 LIKE '%' + @search + '%' OR
        freeform_comments LIKE '%' + @search + '%'
      )`;
      params.search = q;
    }
    
    const orderBy = order === 'impact_desc' 
      ? 'ORDER BY (COALESCE(estimated_dollar_impact, 0) + COALESCE(miss1_dollars, 0) + COALESCE(miss2_dollars, 0) + COALESCE(miss3_dollars, 0)) DESC'
      : 'ORDER BY created_at DESC';
    
    // Fetch all results (limited to 10k)
    const request = pool.request();
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    const result = await request.query(`
      SELECT TOP 10000
        created_at as submitted_at,
        store_id,
        region_code,
        top_positive as what_worked,
        top_negative_1 as what_didnt,
        miss1 as actions_planned,
        overall_mood as sentiment,
        freeform_comments as comments,
        estimated_dollar_impact as est_impact_dollars,
        submitted_by as author_name
      FROM dbo.store_feedback
      WHERE ${whereClause}
      ${orderBy}
    `);
    
    // Build CSV
    const header = [
      'submitted_at',
      'store_id',
      'region_code',
      'what_worked',
      'what_didnt',
      'actions_planned',
      'sentiment',
      'comments',
      'est_impact_dollars',
      'author_name'
    ].map(h => `"${h}"`).join(',');
    
    const rows = result.recordset.map((r: any) => [
      r.submitted_at?.toISOString() || '',
      r.store_id || '',
      r.region_code || '',
      (r.what_worked || '').replace(/"/g, '""').replace(/\n/g, ' '),
      (r.what_didnt || '').replace(/"/g, '""').replace(/\n/g, ' '),
      (r.actions_planned || '').replace(/"/g, '""').replace(/\n/g, ' '),
      r.sentiment || '',
      (r.comments || '').replace(/"/g, '""').replace(/\n/g, ' '),
      r.est_impact_dollars || '',
      r.author_name || ''
    ].map(v => `"${(v ?? '').toString()}"`).join(','));
    
    const csv = header + '\n' + rows.join('\n');
    
    const filename = `raw_feedback_${start || 'all'}_${end || 'all'}.csv`;
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
    
  } catch (error: any) {
    console.error('❌ CSV export error:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV', details: error.message },
      { status: 500 }
    );
  }
}

