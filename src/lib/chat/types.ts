export type ChatMessage = {
  id: string;
  text: string;
  wallet: string | null;
  username: string | null;
  profilePictureUrl: string | null;
  ts: number;
};

export type ChatMessageEnvelope = {
  type: 'chat:new';
  message: ChatMessage;
};
