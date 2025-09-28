'use client';

import Chat from '~/components/chat/Chat';

export default function HomeClient() {
  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <Chat />
    </div>
  );
}
