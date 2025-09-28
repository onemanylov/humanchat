'use client';

import React from 'react';

export type ChatInputContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function ChatInputContainer({ children, className }: ChatInputContainerProps) {
  return (
    <div className={`bg-transparent p-2 ${className || ''}`}>
      {children}
    </div>
  );
}