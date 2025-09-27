import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, verifySessionToken } from '~/lib/auth';
import { db } from '~/db/client';
import { users } from '~/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ authed: false });

  const session = await verifySessionToken(token);
  if (!session) return NextResponse.json({ authed: false });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.wallet, session.wallet))
    .limit(1);
  if (!user) return NextResponse.json({ authed: false });

  return NextResponse.json({ authed: true, user });
}
