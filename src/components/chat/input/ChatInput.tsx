'use client';

import React, { useState } from 'react';
import { useChat } from '~/providers/ChatProvider';
import { ChatInputContainer } from './ChatInputContainer';
import { ChatInputField } from './ChatInputField';
import { ChatInputSignInPrompt } from './ChatInputSignInPrompt';

export type ChatInputProps = {
  className?: string;
};

export function ChatInput({ className }: ChatInputProps) {
  const { currentUser, sendMessage, isSending, rateLimit } = useChat();
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      
      if (inputValue.trim()) {
        const success = await sendMessage(inputValue.trim());
        if (success) {
          setInputValue('');
        }
      }
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
        disabled={isSending}
        isRateLimited={!!rateLimit}
        isSending={isSending}
      />
    </ChatInputContainer>
  );
}