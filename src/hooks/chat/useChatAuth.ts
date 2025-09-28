'use client';

import { trpc } from '~/trpc/react';

export type ChatAuthState = {
  currentUser: {
    wallet: string;
    username: string | null;
    profilePictureUrl: string | null;
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => void;
};

/**
 * Hook for managing chat authentication state
 * This provides a simpler interface for auth-related functionality
 */
export function useChatAuth(): ChatAuthState {
  const userQuery = trpc.auth.me.useQuery(undefined, {
    staleTime: 1_000 * 30,
    refetchOnWindowFocus: false,
  });

  const signOutMutation = trpc.auth.signOut.useMutation();

  const signOut = () => {
    signOutMutation.mutate();
  };

  return {
    currentUser: userQuery.data?.user ?? null,
    isLoading: userQuery.isLoading,
    isAuthenticated: !!userQuery.data?.user,
    signOut,
  };
}