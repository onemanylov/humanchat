'use client';

import dynamic from 'next/dynamic';

const HomeClient = dynamic(() => import('./home'), { ssr: false });

export default function Home() {
  return <HomeClient />;
}
