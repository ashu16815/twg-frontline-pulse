import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-middleware';

export const dynamic = 'force-dynamic';

// PUT - Update store field
export async function PUT(req: Request, { params }: { params: { store_id: string } }) {
  const authCheck = await requireAdmin(req);
  if (authCheck.error) return authCheck.response;

  try {
    const { store_id } = params;
    const body = await req.json();
    const { field, value } = body;

    if (!field) {
      return NextResponse.json(
        { error: 'Field name is required' },
        { status: 400 }
      );
    }

    const pool = await getDb();
    const request = pool.request();

    // Get old value for audit
    request.input('store_id', store_id);
    const oldResult = await request.query(`
      SELECT TOP 1 ${field} FROM dbo.store_master WHERE store_id = @store_id
    `);
    const oldValue = oldResult.recordset[0]?.[field];

    // Update the field
    request.input('value', value);
    request.input('store_id', store_id);
    await request.query(`UPDATE dbo.store_master SET ${field} = @value, updated_at = SYSDATETIME() WHERE store_id = @store_id`);

    // Cascade updates if region_code or store_id changes
    if (field === 'region_code') {
      await request.query(`
        UPDATE dbo.store_feedback 
        SET region_code = @value
        WHERE store_id = @store_id
      `);
    }

    if (field === 'store_id') {
      request.input('old_store_id', store_id);
      request.input('new_store_id', value);
      await request.query(`
        UPDATE dbo.store_feedback 
        SET store_id = @new_store_id
        WHERE store_id = @old_store_id
      `);
    }

    // Log audit
    request.input('field', field);
    request.input('old_value', oldValue || '');
    request.input('new_value', value || '');
    
    await request.query(`
      INSERT INTO dbo.audit_store_changes (
        store_code, field_name, old_value, new_value, changed_by, changed_at
      )
      VALUES (@store_id, @field, @old_value, @new_value, 'admin', SYSDATETIME())
    `);

    return NextResponse.json({
      ok: true,
      updated_field: field,
      old_value: oldValue,
      new_value: value
    });

  } catch (error: any) {
    console.error('❌ Error updating store:', error);
    return NextResponse.json(
      { error: 'Failed to update store', details: error.message },
      { status: 500 }
    );
  }
}

