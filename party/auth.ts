import { jwtVerify } from 'jose';
import type * as Party from 'partykit/server';

export type TokenPayload = {
  wallet?: string;
  username?: string | null;
};

export async function verifyJwtToken<T extends TokenPayload>(
  token: string,
  secret: string,
) {
  const encoder = new TextEncoder();
  const { payload } = await jwtVerify(token, encoder.encode(secret));
  return { payload: payload as T };
}

export function tokenFromRequest(request: Party.Request): string | null {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get('token');
  if (fromQuery) return fromQuery;
  const header = request.headers.get('Authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }
  return null;
}
