import { useCallback, useMemo, useState } from 'react';
import type PartySocket from 'partysocket';
import type { ChatMessage } from '~/lib/chat/types';

type CurrentUser = {
  wallet: string;
  username: string | null;
  profilePictureUrl: string | null;
} | null;

export function useSendMessage(
  socket: PartySocket | null,
  currentUser: CurrentUser,
  opts: {
    disabled?: boolean;
    isRateLimited?: boolean;
    onSendOptimistic: (message: ChatMessage) => void;
  },
) {
  const { disabled = false, isRateLimited = false, onSendOptimistic } = opts;
  const [value, setValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const isReady = useMemo(
    () => Boolean(socket && socket.readyState === socket?.OPEN),
    [socket],
  );
  const canSend =
    !disabled && !isRateLimited && isReady && value.trim().length > 0;

  const sendMessage = useCallback(() => {
    if (!socket || !canSend || !currentUser) return;

    const clientId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const now = Date.now();

    const payload = {
      type: 'chat:message',
      text: value.trim(),
      wallet: currentUser.wallet,
      username: currentUser.username,
      profilePictureUrl: currentUser.profilePictureUrl,
      clientId,
    } as const;

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

  return { value, setValue, isSending, canSend, sendMessage } as const;
}
