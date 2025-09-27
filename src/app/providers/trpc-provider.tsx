'use client';

import { TRPCProvider } from '~/trpc/react';

export default function AppTRPCProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TRPCProvider>{children}</TRPCProvider>;
}
