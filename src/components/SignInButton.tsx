'use client';

import {
  MiniKit,
  type MiniAppWalletAuthSuccessPayload,
} from '@worldcoin/minikit-js';
import { useRouter } from 'next/navigation';
import { generateMockWalletAuth, isMockAuthEnabled } from '~/lib/mockAuth';
import { trpc } from '~/trpc/react';

export default function SignInButton() {
  const router = useRouter();
  const nonceMutation = trpc.auth.nonce.useMutation();
  const completeSiwe = trpc.auth.completeSiwe.useMutation({
    onSuccess: async () => {
      router.replace('/');
      router.refresh();
    },
  });
  const onClick = async () => {
    const useMockAuth = isMockAuthEnabled() || !MiniKit.isInstalled();

    if (!useMockAuth && !MiniKit.isInstalled()) return;

    const { nonce } = await nonceMutation.mutateAsync();

    if (useMockAuth) {
      // Use mock authentication for development
      const { finalPayload, user } = generateMockWalletAuth(nonce);

      await completeSiwe.mutateAsync({
        payload: finalPayload as MiniAppWalletAuthSuccessPayload,
        nonce,
        username: user.username,
        profilePictureUrl: user.profilePictureUrl,
      });
    } else {
      // Use real MiniKit authentication
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId: '0',
        expirationTime: new Date(
          new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
        ),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement:
          'This is my statement and here is a link https://worldcoin.com/apps',
      });

      if ((finalPayload as { status: string } | undefined)?.status === 'error')
        return;

      const username = MiniKit.user?.username ?? null;
      const profilePictureUrl = null;

      await completeSiwe.mutateAsync({
        payload: finalPayload as MiniAppWalletAuthSuccessPayload,
        nonce,
        username,
        profilePictureUrl,
      });
    }
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className="flex h-10 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-4 text-sm font-medium transition-colors hover:border-transparent hover:bg-[#f2f2f2] sm:h-12 sm:w-auto sm:px-5 sm:text-base dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
      >
        Sign in with Wallet
      </button>
      {isMockAuthEnabled() && (
        <span className="text-xs text-neutral-500">mock mode enabled</span>
      )}
    </div>
  );
}
