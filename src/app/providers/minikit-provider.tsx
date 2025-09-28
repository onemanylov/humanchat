'use client';

import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';

export default function MiniKitRootProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_WORLD_ID_APP_ID;
  
  if (!appId) {
    console.warn('NEXT_PUBLIC_WORLD_ID_APP_ID not provided. MiniKit features may not work properly.');
    return <>{children}</>;
  }

  return <MiniKitProvider appId={appId}>{children}</MiniKitProvider>;
}
