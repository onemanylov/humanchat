'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useChat } from '~/providers/ChatProvider';
import { ChatInputContainer } from './ChatInputContainer';
import { ChatInputField } from './ChatInputField';
import { ChatInputSignInPrompt } from './ChatInputSignInPrompt';
import { CHAT_MESSAGE_MAX_LENGTH } from '~/lib/constants/chat';

export type ChatInputProps = {
  className?: string;
  onValidationChange?: (validation: { showLengthError: boolean; errorMessage: string | null }) => void;
};

export function ChatInput({ className, onValidationChange }: ChatInputProps) {
  const { currentUser, sendMessage, isSending, rateLimit } = useChat();
  const [inputValue, setInputValue] = useState('');

  const validation = useMemo(() => {
    const trimmedValue = inputValue.trim();
    const isRateLimited = !!rateLimit;
    const isTooLong = trimmedValue.length > CHAT_MESSAGE_MAX_LENGTH;
    const isEmpty = trimmedValue.length === 0;
    
    return {
      canSend: !isEmpty && !isTooLong && !isRateLimited && !isSending,
      showLengthError: isTooLong,
      errorMessage: isTooLong ? 'Message is too long' : null,
    };
  }, [inputValue, rateLimit, isSending]);

  // Notify parent of validation state changes
  useEffect(() => {
    onValidationChange?.({
      showLengthError: validation.showLengthError,
      errorMessage: validation.errorMessage,
    });
  }, [validation.showLengthError, validation.errorMessage, onValidationChange]);

  const handleSend = async () => {
    if (!validation.canSend) return;
    
    const success = await sendMessage(inputValue.trim());
    if (success) {
      setInputValue('');
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await handleSend();
    }
  };

  if (!currentUser) {
    return <ChatInputSignInPrompt className={className} />;
  }

  return (
    <ChatInputContainer className={className}>
      <ChatInputField
        value={inputValue}
        onChange={setInputValue}
        onKeyDown={handleKeyDown}
        onSend={handleSend}
        disabled={isSending}
        isRateLimited={!!rateLimit}
        isSending={isSending}
        canSend={validation.canSend}
      />
    </ChatInputContainer>
  );
}