export interface BaseAckResponse {
  success: boolean;
}

export interface JoinChatAckResponse extends BaseAckResponse {
  chatId: string;
  messages: any; // This will be the paginated messages response
}

export interface LeaveChatAckResponse extends BaseAckResponse {
  chatId: string;
}

export interface SendMessageAckResponse extends BaseAckResponse {
  message: any; // This will be MessageResponseDto
}

export interface ReadMessagesAckResponse extends BaseAckResponse {
  chatId: string;
  messageIds: string[];
}

export interface GetActiveUsersAckResponse extends BaseAckResponse {
  chatId: string;
  userIds: string[];
}

export interface DeleteMessageAckResponse extends BaseAckResponse {
  messageId: string;
}

export interface EditMessageAckResponse extends BaseAckResponse {
  messageId: string;
  message: any; // This will be MessageResponseDto
}

export interface ClearChatMessagesAckResponse extends BaseAckResponse {
  deletedCount: number;
  message: string;
} 