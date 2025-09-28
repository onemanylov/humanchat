'use client';

import type { ChatMessage as ChatMessageType } from '~/lib/chat/types';
import { cn } from '~/lib/utils';
import { ChatMessageAvatar } from '../avatars/ChatMessageAvatar';
import { ChatMessageAuthor } from './ChatMessageAuthor';
import { ChatMessageContent } from './ChatMessageContent';
import { ChatMessageTimestamp } from './ChatMessageTimestamp';

export type ChatMessageProps = {
  message: ChatMessageType;
  isOwn: boolean;
  previousMessage?: ChatMessageType | null;
  className?: string;
};

export function ChatMessage({
  message,
  isOwn,
  previousMessage,
  className,
}: ChatMessageProps) {
  const isNewBlock =
    !previousMessage || previousMessage.wallet !== message.wallet;

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3',
        isOwn ? 'justify-end' : 'justify-start',
        className,
      )}
    >
      {!isOwn && (
        <ChatMessageAvatar message={message} isOwn={isOwn} size={36} />
      )}

      <div
        className={cn(
          'max-w-[80%] rounded-[18px] px-3 py-2 text-sm',
          isOwn
            ? 'bg-gradient-to-b from-[#239cf9] to-[#1c93f5] text-white'
            : 'bg-black/7.5 text-black backdrop-blur-sm',
          !isNewBlock && !isOwn && 'rounded-tl-md',
          !isNewBlock && isOwn && 'rounded-tr-md',
        )}
      >
        {!isOwn && <ChatMessageAuthor message={message} />}

        <ChatMessageContent text={message.text} isPending={message.pending} />

        <ChatMessageTimestamp timestamp={message.ts} isOwn={isOwn} />
      </div>
    </div>
  );
}
