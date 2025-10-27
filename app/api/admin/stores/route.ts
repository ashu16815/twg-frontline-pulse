import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-middleware';

export const dynamic = 'force-dynamic';

// GET - Fetch all stores with filters
export async function GET(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck.error) return authCheck.response;

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const region = searchParams.get('region') || 'all';
    const active = searchParams.get('active') || 'all';

    const pool = await getDb();
    let query = `
      SELECT 
        store_id,
        store_code,
        store_name,
        banner,
        region,
        region_code,
        manager_email,
        active,
        created_at,
        updated_at
      FROM dbo.store_master
      WHERE 1=1
    `;

    // Add filters
    if (q) {
      query += ` AND (store_name LIKE @q OR store_id LIKE @q)`;
    }
    if (region !== 'all') {
      query += ` AND region_code = @region`;
    }
    if (active !== 'all') {
      const activeBool = active === 'true';
      query += ` AND active = @active`;
    }

    query += ` ORDER BY store_name`;

    const request = pool.request();
    if (q) request.input('q', q + '%');
    if (region !== 'all') request.input('region', region);
    if (active !== 'all') request.input('active', active);

    const result = await request.query(query);

    return NextResponse.json({
      ok: true,
      results: result.recordset
    });

  } catch (error: any) {
    console.error('❌ Error fetching stores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}

// POST - Create new store
export async function POST(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck.error) return authCheck.response;

  try {
    const body = await req.json();
    const { store_id, store_code, store_name, region, region_code, manager_email, banner } = body;

    if (!store_id || !store_name || !region_code) {
      return NextResponse.json(
        { error: 'Store ID, name, and region code are required' },
        { status: 400 }
      );
    }

    const pool = await getDb();
    const request = pool.request();

    request.input('store_id', store_id);
    request.input('store_code', store_code ? parseInt(store_code) : null);
    request.input('store_name', store_name);
    request.input('region', region || region_code);
    request.input('region_code', region_code);
    request.input('manager_email', manager_email || null);
    request.input('banner', banner || null);

    await request.query(`
      INSERT INTO dbo.store_master (
        store_id, store_code, store_name, region, region_code,
        manager_email, banner, active, created_at, updated_at
      )
      VALUES (
        @store_id, @store_code, @store_name, @region, @region_code,
        @manager_email, @banner, 1, SYSDATETIME(), SYSDATETIME()
      )
    `);

    // Log audit
    await request.query(`
      INSERT INTO dbo.audit_store_changes (
        store_code, field_name, old_value, new_value, changed_by, changed_at
      )
      VALUES (@store_id, 'created', NULL, 'New store created', 'admin', SYSDATETIME())
    `);

    return NextResponse.json({
      ok: true,
      message: 'Store created successfully'
    });

  } catch (error: any) {
    console.error('❌ Error creating store:', error);
    return NextResponse.json(
      { error: 'Failed to create store', details: error.message },
      { status: 500 }
    );
  }
}

