import { NextResponse } from 'next/server';
import { client, db, initializeDatabase } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const urlEnv = process.env.TURSO_DATABASE_URL || '';
  const tokenEnv = process.env.TURSO_AUTH_TOKEN || '';

  const diagnostics: any = {
    hasUrl: !!urlEnv,
    urlPrefix: urlEnv.slice(0, 15),
    urlLength: urlEnv.length,
    hasToken: !!tokenEnv,
    tokenPrefix: tokenEnv.slice(0, 15),
    tokenLength: tokenEnv.length,
    nodeEnv: process.env.NODE_ENV,
  };

  try {
    await initializeDatabase();
    diagnostics.initDb = 'success';
  } catch (err: any) {
    diagnostics.initDbError = {
      message: err.message,
      code: err.code,
      cause: err.cause?.message || String(err.cause),
    };
  }

  try {
    const rawRes = await client.execute({
      sql: 'SELECT id, email, role FROM users LIMIT 1',
      args: [],
    });
    diagnostics.rawClientQuery = {
      success: true,
      rowsCount: rawRes.rows.length,
    };
  } catch (err: any) {
    diagnostics.rawClientQuery = {
      success: false,
      message: err.message,
      code: err.code,
      cause: err.cause?.message || String(err.cause),
    };
  }

  try {
    const drizzleRes = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .limit(1);
    diagnostics.drizzleQuery = {
      success: true,
      rowsCount: drizzleRes.length,
    };
  } catch (err: any) {
    diagnostics.drizzleQuery = {
      success: false,
      message: err.message,
      code: err.code,
      cause: err.cause?.message || String(err.cause),
    };
  }

  return NextResponse.json(diagnostics);
}
