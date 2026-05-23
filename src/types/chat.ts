export interface ChatMessage {
  id: string;
  sender: "me" | "agent";
  text: string;
  sentAt: string;
}

export interface ChatRoom {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPrice: string;
  participantName: string;
  avatarUrl: string;
  lastMessage: string;
  unreadCount: number;
  messages: ChatMessage[];
}
