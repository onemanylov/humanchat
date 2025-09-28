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
