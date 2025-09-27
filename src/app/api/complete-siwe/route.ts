import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  MiniAppWalletAuthSuccessPayload,
  verifySiweMessage,
} from '@worldcoin/minikit-js';
import { db } from '~/db/client';
import { users } from '~/db/schema';
import { SESSION_COOKIE_NAME, createSessionToken } from '~/lib/auth';

export const runtime = 'nodejs';

type IRequestPayload = {
  payload: MiniAppWalletAuthSuccessPayload;
  nonce: string;
  username?: string | null;
  profilePictureUrl?: string | null;
};

export const POST = async (req: NextRequest) => {
  const { payload, nonce, username, profilePictureUrl } =
    (await req.json()) as IRequestPayload;
  const cookieStore = await cookies();
  const cookieNonce = cookieStore.get('siwe')?.value;
  if (!cookieNonce || nonce !== cookieNonce) {
    return NextResponse.json({
      status: 'error',
      isValid: false,
      message: 'Invalid nonce',
    });
  }
  try {
    const validMessage = await verifySiweMessage(payload, nonce);
    if (!validMessage.isValid) {
      return NextResponse.json({ status: 'error', isValid: false });
    }
    await db
      .insert(users)
      .values({
        wallet: payload.address,
        username: username ?? null,
        profilePictureUrl: profilePictureUrl ?? null,
      })
      .onConflictDoUpdate({
        target: users.wallet,
        set: {
          username: username ?? null,
          profilePictureUrl: profilePictureUrl ?? null,
        },
      });
    const token = await createSessionToken({
      wallet: payload.address,
      username,
    });
    const res = NextResponse.json({ status: 'success', isValid: true });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', isValid: false, message });
  }
};
