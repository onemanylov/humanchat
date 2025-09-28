import { useRouter } from 'next/navigation';
import { trpc } from '~/trpc/react';

export function useSignOut() {
  const router = useRouter();
  const signOut = trpc.auth.signOut.useMutation({
    onSuccess: () => {
      router.refresh();
      router.replace('/login');
    },
  });

  return signOut;
}
