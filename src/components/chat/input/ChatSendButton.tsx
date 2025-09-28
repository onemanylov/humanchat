'use client';

import React from 'react';

export type ChatSendButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

export function ChatSendButton({ onClick, disabled = false, className = '' }: ChatSendButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center w-8 h-8 rounded-full
        transition-colors duration-200
        ${disabled 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
        }
        ${className}
      `}
      type="button"
      aria-label="Send message"
    >
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </svg>
    </button>
  );
}