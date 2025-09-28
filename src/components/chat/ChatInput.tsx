'use client';

import { useEffect } from 'react';
import type PartySocket from 'partysocket';
import { cn } from '~/lib/utils';
import type { ChatMessage } from '~/lib/chat/types';
import { useSendMessage } from '~/hooks';

export type ChatInputProps = {
  socket: PartySocket | null;
  currentUser: {
    wallet: string;
    username: string | null;
    profilePictureUrl: string | null;
  } | null;
  disabled?: boolean;
  isRateLimited?: boolean;
  onSendOptimistic: (message: ChatMessage) => void;
};

export function ChatInput({
  socket,
  currentUser,
  disabled = false,
  isRateLimited = false,
  onSendOptimistic,
}: ChatInputProps) {
  const { value, setValue, isSending, canSend, sendMessage } = useSendMessage(
    socket,
    currentUser,
    {
      disabled,
      isRateLimited,
      onSendOptimistic,
    },
  );

  useEffect(() => {
    // No-op: kept to mirror previous behavior when socket changed
  }, [socket]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    event,
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  if (!currentUser) {
    return (
      <div className="border-border bg-muted text-muted-foreground rounded-2xl border px-4 py-3 text-sm">
        You need to be signed in to send messages.
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isRateLimited ? 'Rate limit reached…' : 'Type your message'
        }
        disabled={disabled || isRateLimited || isSending}
        rows={1}
        className={cn(
          'bg-muted text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/40 h-12 flex-1 resize-none rounded-xl border border-transparent px-4 py-3 text-sm focus:ring-2 focus:outline-none',
          'scrollbar-thin',
          (disabled || isRateLimited) && 'cursor-not-allowed opacity-60',
        )}
      />
      <button
        onClick={sendMessage}
        disabled={!canSend || isSending}
        className={cn(
          'rounded-full px-5 py-2 text-sm font-medium transition-colors',
          canSend
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground',
          isSending && 'opacity-70',
        )}
      >
        Send
      </button>
    </div>
  );
}
