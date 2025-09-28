"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/react";

export default function DevMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const signOut = trpc.auth.signOut.useMutation({
    onSuccess: () => {
      router.refresh();
      router.replace("/login");
    },
  });
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d")
        setOpen((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return (
    <div className="fixed right-4 bottom-4 z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-black px-4 py-2 text-sm text-white shadow-lg dark:bg-white dark:text-black"
      >
        Dev
      </button>
      {open && (
        <div className="mt-2 w-64 rounded-lg border border-black/10 bg-white p-3 shadow-xl dark:border-white/20 dark:bg-black">
          <div className="mb-2 text-xs opacity-60">Debug actions</div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.refresh()}
              className="rounded-md border px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              Refresh
            </button>
            <button
              onClick={() => router.push("/login")}
              className="rounded-md border px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              Go to Login
            </button>
            <button
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
              className="dark:hover:bg:white/10 rounded-md border px-3 py-2 text-left text-sm hover:bg-black/5 disabled:opacity-50"
            >
              Sign Out
            </button>
            <div className="text-xs opacity-60">
              {me.data?.user
                ? `Authed as ${me.data.user.username ?? me.data.user.wallet}`
                : "Not authed"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
