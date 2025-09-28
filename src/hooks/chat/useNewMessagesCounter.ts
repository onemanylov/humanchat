import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '~/lib/chat/types';

export function useNewMessagesCounter(
  messages: ChatMessage[],
  isAtBottom: boolean,
  scrollDistance: number,
) {
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenTsRef = useRef<number>(0);
  const lastCountRef = useRef<number>(0);

  // Reset when at bottom
  useEffect(() => {
    if (isAtBottom) {
      setUnreadCount(0);
      const last = messages[messages.length - 1];
      if (last) lastSeenTsRef.current = last.ts;
    }
  }, [isAtBottom, messages]);

  // Increment when new messages arrive and we're not at bottom
  useEffect(() => {
    const hasNew = messages.length > lastCountRef.current;
    const lastMessage = messages[messages.length - 1];
    lastCountRef.current = messages.length;

    if (!hasNew || !lastMessage) return;
    if (isAtBottom) return;
    if (scrollDistance < 40) return; // avoid flicker when nearly bottom

    setUnreadCount((prev) => prev + 1);
  }, [messages, isAtBottom, scrollDistance]);

  return unreadCount;
}
