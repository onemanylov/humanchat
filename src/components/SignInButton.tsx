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
    <div className="flex w-full flex-col items-center gap-1">
      <button
        onClick={onClick}
        className="flex h-[60px] w-full items-center justify-center rounded-full bg-black px-6 text-lg font-semibold text-white ring-[1px] ring-blue-400/5 transition-colors sm:h-[72px] sm:w-auto sm:px-8 sm:text-xl"
      >
        Login with wallet
      </button>
      {isMockAuthEnabled() && (
        <span className="text-xs text-neutral-500">mock mode enabled</span>
      )}
    </div>
  );
}
