export interface MessageDTO {
  id?: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface SendMessageRequest {
  receiverId: number;
  content: string;
}

export interface ChatUserDTO {
  id: number;
  fullName: string;
  email: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}
