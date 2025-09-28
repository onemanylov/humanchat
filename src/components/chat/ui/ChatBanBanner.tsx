'use client';

import React, { useState, useEffect } from 'react';
import { MODERATION_CONFIG } from '~/lib/moderation/config';

export type ChatBanBannerProps = {
  reason: string;
  isTemporary: boolean;
  expiresAt?: number;
  className?: string;
};

export function ChatBanBanner({ reason, isTemporary, expiresAt, className = '' }: ChatBanBannerProps) {
  const [remainingTime, setRemainingTime] = useState<string>('');

  useEffect(() => {
    if (!isTemporary || !expiresAt) return;

    const updateRemainingTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiresAt - now);
      
      if (remaining <= 0) {
        setRemainingTime('0h 0m');
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      setRemainingTime(`${hours}h ${minutes}m`);
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isTemporary, expiresAt]);

  if (isTemporary) {
    return (
      <div className={`rounded-lg border border-red-500/30 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm ${className}`}>
        <div className="flex items-center justify-center text-center">
          <div>
            🚫 You've been banned for 24h due to repeated violations: {reason}.
            {remainingTime && (
              <div className="mt-1 text-xs text-red-600">
                Time remaining: {remainingTime}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-red-600/50 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-sm ${className}`}>
      <div className="flex items-center justify-center text-center">
        <div>
          🚫 Your account has been permanently banned: {reason}.
          <div className="mt-2">
            <a 
              href={MODERATION_CONFIG.APPEAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-700 underline hover:text-red-800"
            >
              Appeal this decision
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}