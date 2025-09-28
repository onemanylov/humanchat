'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '~/trpc/react';
import { useKeyboardShortcut, useSignOut } from '~/hooks';

export default function DevMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const signOut = useSignOut();
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  useKeyboardShortcut({ metaOrCtrl: true, key: 'd' }, () => setOpen((v) => !v));
  return (
    <div className="fixed top-4 left-4 z-50 hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-black px-4 py-2 text-sm text-white shadow-lg"
      >
        Dev
      </button>
      {open && (
        <div className="mt-2 w-64 rounded-lg border border-black/10 bg-white p-3 shadow-xl">
          <div className="mb-2 text-xs opacity-60">Debug actions</div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.refresh()}
              className="rounded-md border px-3 py-2 text-left text-sm hover:bg-black/5"
            >
              Refresh
            </button>
            <button
              onClick={() => router.push('/login')}
              className="rounded-md border px-3 py-2 text-left text-sm hover:bg-black/5"
            >
              Go to Login
            </button>
            <button
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
              className="rounded-md border px-3 py-2 text-left text-sm hover:bg-black/5 disabled:opacity-50"
            >
              Sign Out
            </button>
            <div className="text-xs opacity-60">
              {me.data?.user
                ? `Authed as ${me.data.user.username ?? me.data.user.wallet}`
                : 'Not authed'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
