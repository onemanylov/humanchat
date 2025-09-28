'use client';

import { useMemo } from 'react';
import type { ChatMessage as ChatMessageType } from '~/lib/chat/types';
import { sortMessagesByTimestamp } from '~/lib/chat/utils/message-sorting';
import { ChatMessage } from './ChatMessage';

export type ChatMessageListProps = {
  messages: ChatMessageType[];
  currentWallet: string | null | undefined;
  className?: string;
};

export function ChatMessageList({ 
  messages, 
  currentWallet, 
  className 
}: ChatMessageListProps) {
  const sortedMessages = useMemo(() => {
    return sortMessagesByTimestamp(messages);
  }, [messages]);

  if (sortedMessages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-[14px] text-white/60">
        Loading chat...
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className || ''}`}>
      {sortedMessages.map((message, index) => (
        <ChatMessage
          key={message.clientId ?? message.id}
          message={message}
          isOwn={
            currentWallet
              ? message.wallet?.toLowerCase() === currentWallet.toLowerCase()
              : false
          }
          previousMessage={index > 0 ? sortedMessages[index - 1] : null}
        />
      ))}
    </div>
  );
}