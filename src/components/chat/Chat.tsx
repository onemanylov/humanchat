'use client';

import { useChat } from '~/providers/ChatProvider';
import { ChatMessages } from './messages/ChatMessages';
import { ChatInput } from './input/ChatInput';
import { ChatRateLimitBanner } from './ui/ChatRateLimitBanner';

export default function Chat() {
  const { rateLimit, remainingSeconds } = useChat();

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <div className="flex h-full w-full flex-1 flex-col overflow-hidden">
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <ChatMessages />
          <ChatInput />
        </div>

        <ChatRateLimitBanner 
          rateLimit={rateLimit}
          remainingSeconds={remainingSeconds}
        />
      </div>
    </div>
  );
}