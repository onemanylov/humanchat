'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type PartySocket from 'partysocket';
import { cn } from '~/lib/utils';
import type { ChatMessage } from '~/lib/chat/types';

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
  const [value, setValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!socket) {
      setIsSending(false);
    }
  }, [socket]);

  const isReady = useMemo(() => {
    return Boolean(socket && socket.readyState === socket.OPEN);
  }, [socket]);

  const canSend = !disabled && !isRateLimited && isReady && value.trim().length > 0;

  const sendMessage = useCallback(() => {
    if (!socket || !canSend || !currentUser) return;

    const clientId =
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const now = Date.now();

    const payload = {
      type: 'chat:message',
      text: value.trim(),
      wallet: currentUser.wallet,
      username: currentUser.username,
      profilePictureUrl: currentUser.profilePictureUrl,
      clientId,
    };

    try {
      setIsSending(true);
      onSendOptimistic({
        id: clientId,
        clientId,
        text: payload.text,
        wallet: currentUser.wallet,
        username: currentUser.username,
        profilePictureUrl: currentUser.profilePictureUrl,
        ts: now,
        pending: true,
      });
      socket.send(JSON.stringify(payload));
      setValue('');
    } catch (error) {
      console.error('Failed to send chat message:', error);
    } finally {
      setIsSending(false);
    }
  }, [canSend, currentUser, onSendOptimistic, socket, value]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  if (!currentUser) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/70">
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
        placeholder={isRateLimited ? 'Rate limit reached…' : 'Type your message'}
        disabled={disabled || isRateLimited || isSending}
        rows={1}
        className={cn(
          'h-12 flex-1 resize-none rounded-xl bg-[#0c0f1a] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50',
          'scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent',
          (disabled || isRateLimited) && 'cursor-not-allowed opacity-60',
        )}
      />
      <button
        onClick={sendMessage}
        disabled={!canSend || isSending}
        className={cn(
          'rounded-full px-5 py-2 text-sm font-medium text-white transition-colors',
          canSend ? 'bg-violet-500 hover:bg-violet-400' : 'bg-white/10 text-white/60',
          isSending && 'opacity-70',
        )}
      >
        Send
      </button>
    </div>
  );
}
