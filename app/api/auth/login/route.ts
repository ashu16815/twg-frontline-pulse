import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSessionToken, setSessionCookie } from '@/lib/auth';
import sql from 'mssql';

export async function POST(req: Request) {
  const timestamp = new Date().toISOString();
  
  try {
    const body = await req.json();
    const user_id = (body.user_id || '').trim();
    const password = (body.password || '').trim();

    console.log(`🔐 [${timestamp}] LOGIN API START:`, { 
      user_id, 
      hasPassword: !!password,
      userAgent: req.headers.get('user-agent')?.substring(0, 50) + '...',
      referer: req.headers.get('referer')?.substring(0, 50) + '...'
    });

    if (!user_id || !password) {
      console.log(`❌ [${timestamp}] LOGIN API MISSING CREDENTIALS`);
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const pool = await getDb();
    const r = await pool
      .request()
      .input('uid', sql.NVarChar(32), user_id)
      .query`select top(1) * from dbo.app_users where user_id=@uid and is_active=1`;

    const u = r.recordset[0];
    if (!u) {
      console.log(`❌ [${timestamp}] LOGIN API USER NOT FOUND:`, user_id);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      console.log(`❌ [${timestamp}] LOGIN API INVALID PASSWORD:`, user_id);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log(`✅ [${timestamp}] LOGIN API SUCCESS:`, { 
      user_id: u.user_id, 
      name: u.full_name,
      role: u.role 
    });

    // Update last login
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, u.id)
      .query`update dbo.app_users set last_login_at=sysutcdatetime() where id=@id`;

    // Create session
    const token = await createSessionToken({
      sub: u.id,
      user_id: u.user_id,
      name: u.full_name,
      role: u.role || undefined
    });

    console.log(`🔑 [${timestamp}] LOGIN API TOKEN CREATED:`, {
      user_id: u.user_id,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + '...'
    });
    
    // Create response
    const response = NextResponse.json({
      ok: true,
      user: {
        user_id: u.user_id,
        name: u.full_name,
        role: u.role
      }
    });

    // Set cookie using Set-Cookie header directly
    const COOKIE = process.env.SESSION_COOKIE_NAME || 'wis_session';
    const MAX_AGE = 14 * 24 * 60 * 60; // 14 days in seconds
    
    // Build cookie string manually to ensure it works in Vercel
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Try a simpler cookie approach for Vercel
    const cookieValue = `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`;
    
    // Set cookie via headers (most reliable method)
    response.headers.set('Set-Cookie', cookieValue);
    
    // Also try setting it via the NextResponse cookies method
    response.cookies.set(COOKIE, token, {
      httpOnly: false, // Temporarily disable HttpOnly to test
      secure: false,   // Temporarily disable Secure to test
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE
    });

    console.log(`🍪 [${timestamp}] LOGIN API COOKIE SET:`, {
      cookieName: COOKIE,
      cookieValue: cookieValue.substring(0, 100) + '...',
      maxAge: MAX_AGE,
      responseHeaders: Object.fromEntries(response.headers.entries())
    });
    
    return response;
  } catch (e: any) {
    console.error(`💥 [${timestamp}] LOGIN API ERROR:`, e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

