export interface BaseAckResponse {
  success: boolean;
}

export interface JoinChatAckResponse extends BaseAckResponse {
  chatId: string;
  messages: any; // This should match the type from chatService.getChatMessages
}

export interface LeaveChatAckResponse extends BaseAckResponse {
  chatId: string;
}

export interface SendMessageAckResponse extends BaseAckResponse {
  message: any; // This should match the type from chatService.createMessage
}

export interface ReadMessagesAckResponse extends BaseAckResponse {
  chatId: string;
  messageIds: string[];
}

export interface GetActiveUsersAckResponse extends BaseAckResponse {
  chatId: string;
  userIds: string[];
} 