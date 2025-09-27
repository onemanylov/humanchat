'use client';

import { usePathname } from 'next/navigation';
import FullPageLoadingProvider from './loading-provider';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  if (isLogin) return <>{children}</>;
  return <FullPageLoadingProvider>{children}</FullPageLoadingProvider>;
}
