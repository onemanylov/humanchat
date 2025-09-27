import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export function GET() {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const res = NextResponse.json({ nonce });
  res.cookies.set('siwe', nonce, {
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  return res;
}
