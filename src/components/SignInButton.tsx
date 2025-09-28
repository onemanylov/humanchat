'use client';

import { useRouter } from 'next/navigation';
import { isMockAuthEnabled } from '~/lib/mockAuth';
import { useWalletSignIn } from '~/hooks';

export default function SignInButton() {
  const router = useRouter();
  const { signIn } = useWalletSignIn();
  const onClick = async () => {
    await signIn();
    router.replace('/');
    router.refresh();
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className="flex h-10 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-4 text-sm font-medium transition-colors hover:border-transparent hover:bg-[#f2f2f2] sm:h-12 sm:w-auto sm:px-5 sm:text-base"
      >
        Sign in with Wallet
      </button>
      {isMockAuthEnabled() && (
        <span className="text-xs text-neutral-500">mock mode enabled</span>
      )}
    </div>
  );
}
