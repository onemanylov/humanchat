'use client';

export type ChatInputSignInPromptProps = {
  className?: string;
};

export function ChatInputSignInPrompt({ className }: ChatInputSignInPromptProps) {
  return (
    <div className={`border-border bg-muted text-muted-foreground rounded-2xl border px-4 py-3 text-sm ${className || ''}`}>
      You need to be signed in to send messages.
    </div>
  );
}