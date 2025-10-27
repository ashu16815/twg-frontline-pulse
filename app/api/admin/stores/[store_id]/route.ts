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

    // Get old value for audit
    const oldRequest = pool.request();
    oldRequest.input('store_id', store_id);
    const oldResult = await oldRequest.query(`
      SELECT TOP 1 ${field} FROM dbo.store_master WHERE store_id = @store_id
    `);
    const oldValue = oldResult.recordset[0]?.[field];

    // Update the field
    const updateRequest = pool.request();
    updateRequest.input('value', value);
    updateRequest.input('store_id', store_id);
    await updateRequest.query(`UPDATE dbo.store_master SET ${field} = @value, updated_at = SYSDATETIME() WHERE store_id = @store_id`);

    // Cascade updates if region_code or store_id changes
    if (field === 'region_code') {
      const cascadeRequest = pool.request();
      cascadeRequest.input('value', value);
      cascadeRequest.input('store_id', store_id);
      await cascadeRequest.query(`
        UPDATE dbo.store_feedback 
        SET region_code = @value
        WHERE store_id = @store_id
      `);
    }

    if (field === 'store_id') {
      const cascadeRequest = pool.request();
      cascadeRequest.input('old_store_id', store_id);
      cascadeRequest.input('new_store_id', value);
      await cascadeRequest.query(`
        UPDATE dbo.store_feedback 
        SET store_id = @new_store_id
        WHERE store_id = @old_store_id
      `);
    }

    // Log audit
    const auditRequest = pool.request();
    auditRequest.input('store_id', store_id);
    auditRequest.input('field', field);
    auditRequest.input('old_value', oldValue || '');
    auditRequest.input('new_value', value || '');
    
    await auditRequest.query(`
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

