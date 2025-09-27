'use client';

import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';

export default function MiniKitRootProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MiniKitProvider>{children}</MiniKitProvider>;
}
