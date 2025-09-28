import { trpc } from '~/trpc/react';

export function useAuth() {
  const meQuery = trpc.auth.me.useQuery(undefined, {
    staleTime: 1_000 * 30,
    refetchOnWindowFocus: false,
  });
  const user = meQuery.data?.user ?? null;
  return { ...meQuery, user } as const;
}
