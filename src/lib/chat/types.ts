export type ChatMessage = {
  id: string;
  clientId?: string;
  text: string;
  wallet: string | null;
  username: string | null;
  profilePictureUrl: string | null;
  ts: number;
  pending?: boolean;
};

export type ChatMessageEnvelope = {
  type: 'chat:new';
  message: ChatMessage;
};

export type ChatMessageDeletedEnvelope = {
  type: 'chat:message:deleted';
  messageId: string;
};

export type ChatUserWarnedEnvelope = {
  type: 'chat:user:warned';
  wallet: string;
  reason: string;
};

export type ChatUserBannedEnvelope = {
  type: 'chat:user:banned';
  wallet: string;
  reason: string;
  isTemporary: boolean;
  expiresAt?: number;
};

export type OnlineUser = {
  wallet: string;
  username: string | null;
  profilePictureUrl: string | null;
};
