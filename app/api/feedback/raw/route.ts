import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feedback/raw
 * Fetch raw feedback with filters and pagination
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
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '25'), 1), 200);
    const order = searchParams.get('order') || 'submitted_at_desc';
    
    const skip = (page - 1) * pageSize;
    
    const pool = await getDb();
    
    // Build WHERE clause
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
    
    // Order by
    const orderBy = order === 'impact_desc' 
      ? '(COALESCE(estimated_dollar_impact, 0) + COALESCE(miss1_dollars, 0) + COALESCE(miss2_dollars, 0) + COALESCE(miss3_dollars, 0)) DESC'
      : 'created_at DESC';
    
    // Get total count
    const countRequest = pool.request();
    Object.entries(params).forEach(([key, value]) => {
      countRequest.input(key, value);
    });
    
    const countResult = await countRequest.query(`
      SELECT COUNT(*) as total
      FROM dbo.store_feedback
      WHERE ${whereClause}
    `);
    const total = countResult.recordset[0].total;
    
    // Get paginated results
    const request = pool.request();
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    const result = await request.query(`
      SELECT 
        id,
        store_id,
        store_name,
        region_code,
        store_code,
        iso_week,
        top_positive,
        top_negative_1,
        top_negative_2,
        top_negative_3,
        miss1,
        miss2,
        miss3,
        overall_mood,
        freeform_comments,
        estimated_dollar_impact,
        created_at,
        submitted_by
      FROM dbo.store_feedback
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      OFFSET ${skip} ROWS
      FETCH NEXT ${pageSize} ROWS ONLY
    `);
    
    const results = result.recordset.map((r: any) => ({
      id: r.id,
      store_id: r.store_id,
      store_name: r.store_name,
      region_code: r.region_code,
      store_code: r.store_code,
      iso_week: r.iso_week,
      what_worked: r.top_positive,
      what_didnt: r.top_negative_1,
      actions_planned: r.miss1,
      sentiment: r.overall_mood,
      comments: r.freeform_comments,
      est_impact_dollars: r.estimated_dollar_impact,
      submitted_at: r.created_at,
      author_name: r.submitted_by
    }));
    
    return NextResponse.json({
      total,
      page,
      pageSize,
      results
    });
    
  } catch (error: any) {
    console.error('❌ Raw feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback', details: error.message },
      { status: 500 }
    );
  }
}

