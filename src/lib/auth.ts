import { env } from '~/env';

export const SESSION_COOKIE_NAME = 'session';

const getSecret = (): Uint8Array => {
  const secret = env.JWT_SECRET || 'dev-secret-change-me';
  return new TextEncoder().encode(secret);
};

import { SignJWT, jwtVerify } from 'jose';

export type SessionPayload = {
  wallet: string;
  username?: string | null;
};

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  const token = await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
  return token;
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      wallet: String(payload.wallet),
      username: (payload.username as string | null | undefined) ?? null,
    };
  } catch {
    return null;
  }
}
