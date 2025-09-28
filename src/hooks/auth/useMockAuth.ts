import { generateMockWalletAuth, isMockAuthEnabled } from '~/lib/mockAuth';
import {
  MiniKit,
  type MiniAppWalletAuthSuccessPayload,
} from '@worldcoin/minikit-js';
import { trpc } from '~/trpc/react';

export function useWalletSignIn() {
  const nonceMutation = trpc.auth.nonce.useMutation();
  const completeSiwe = trpc.auth.completeSiwe.useMutation();

  const signIn = async () => {
    const useMockAuth = isMockAuthEnabled() || !MiniKit.isInstalled();

    if (!useMockAuth && !MiniKit.isInstalled()) return;

    const { nonce } = await nonceMutation.mutateAsync();

    if (useMockAuth) {
      const { finalPayload, user } = generateMockWalletAuth(nonce);
      await completeSiwe.mutateAsync({
        payload: finalPayload as MiniAppWalletAuthSuccessPayload,
        nonce,
        username: user.username,
        profilePictureUrl: user.profilePictureUrl,
      });
    } else {
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

  return {
    signIn,
    isPending: nonceMutation.isPending || completeSiwe.isPending,
  } as const;
}
