# Chat API Documentation

This document provides comprehensive information for frontend developers on how to integrate with the chat functionality in the application.

## Table of Contents

1. [Introduction](#introduction)
2. [RESTful API Endpoints](#restful-api-endpoints)
3. [WebSocket Integration](#websocket-integration)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Code Examples](#code-examples)
7. [Swagger Documentation](#swagger-documentation)

## Introduction

The chat system enables real-time communication between users and administrators. It supports:

- Creating and managing chat rooms
- Sending and receiving messages in real-time
- File attachments
- Message replies
- Typing indicators
- Read receipts
- Chat status updates (active, pending, closed)

## RESTful API Endpoints

All REST endpoints require authentication via JWT Bearer token.

### Chat Management

#### Create a new chat

```
POST /chat
```

**Request Body:**
```json
{
  "initialMessage": "Hello, I need help with my account"
}
```

**Response:** The newly created chat object

#### Get user's chats

```
GET /chat?status=ACTIVE
```

**Query Parameters:**
- `status` (optional): Filter by chat status (ACTIVE, PENDING, CLOSED)

**Response:** Array of chat objects

#### Get chat by ID

```
GET /chat/:id
```

**Response:** Chat object with messages

#### Update chat status

```
PATCH /chat/:id/status
```

**Request Body:**
```json
{
  "status": "CLOSED"
}
```

**Response:** Updated chat object

### Message Management

#### Send a message

```
POST /chat/:id/messages
```

**Request Body:**
```json
{
  "chatId": "chat-uuid",
  "text": "Message content",
  "fileId": "optional-file-uuid",
  "replyToId": "optional-message-uuid"
}
```

**Response:** Created message object

#### Get chat messages

```
GET /chat/:id/messages?page=1&limit=20
```

**Query Parameters:**
- `page` (optional): Page number, defaults to 1
- `limit` (optional): Items per page, defaults to 20

**Response:**
```json
{
  "data": [/* array of messages */],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

## WebSocket Integration

### Connection

Connect to the WebSocket server using:

```javascript
const socket = io('https://your-api-domain.com', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Alternative connection with headers
const socket = io('https://your-api-domain.com', {
  extraHeaders: {
    authorization: `Bearer ${yourJwtToken}`
  }
});
```

### Events

#### Client-to-Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `joinChat` | `"chat-uuid"` | Join a specific chat room |
| `leaveChat` | `"chat-uuid"` | Leave a specific chat room |
| `sendMessage` | MessageDTO | Send a new message |
| `typing` | `{ chatId: "chat-uuid", isTyping: boolean }` | Indicate typing status |
| `readMessages` | `{ chatId: "chat-uuid", messageIds: ["message-uuid"] }` | Mark messages as read |
| `getActiveUsers` | `"chat-uuid"` | Get active users in a chat |

#### Server-to-Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `joinedChat` | `{ chatId: "chat-uuid", messages: [...] }` | Successfully joined chat |
| `leftChat` | `{ chatId: "chat-uuid" }` | Successfully left chat |
| `newMessage` | MessageObject | New message received |
| `userTyping` | `{ userId: "user-uuid", email: "user@example.com", isTyping: boolean }` | User typing status |
| `messagesRead` | `{ userId: "user-uuid", messageIds: ["message-uuid"] }` | Messages read by user |
| `chatStatusChanged` | `{ chatId: "chat-uuid", status: "ACTIVE" }` | Chat status updated |
| `participantUpdate` | `{ chatId: "chat-uuid", userId: "user-uuid", action: "joined" }` | User joined/left chat |
| `activeUsers` | `{ chatId: "chat-uuid", userIds: ["user-uuid"] }` | Active users in chat |
| `error` | `"Error message"` | Error occurred |

### Error Handling

WebSocket errors are returned as `error` events with a string message. Common error scenarios:
- Authentication failure
- Access denied to chat
- Invalid message format
- Rate limiting exceeded

## Data Models

### Chat Object

```typescript
interface Chat {
  id: string;
  client: User;
  admin?: User;
  status: "ACTIVE" | "CLOSED" | "PENDING";
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}
```

### Message Object

```typescript
interface Message {
  id: string;
  chatId: string;
  sender: User;
  text?: string;
  fileUrl?: string;
  replyToId?: string;
  replyTo?: Message;
  createdAt: string;
}
```

### User Object

```typescript
interface User {
  id: string;
  email: string;
  role: string;
  profile?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}
```

## Code Examples

### Complete Integration Example

```javascript
import { io } from 'socket.io-client';

class ChatService {
  constructor(apiBaseUrl, token) {
    this.apiBaseUrl = apiBaseUrl;
    this.token = token;
    this.socket = null;
    this.currentChatId = null;
    this.eventHandlers = {
      newMessage: [],
      statusChange: [],
      typing: [],
      error: []
    };
  }

  // Initialize socket connection
  connect() {
    this.socket = io(this.apiBaseUrl, {
      auth: { token: this.token }
    });

    // Set up event listeners
    this.socket.on('newMessage', (message) => {
      this.eventHandlers.newMessage.forEach(handler => handler(message));
    });

    this.socket.on('chatStatusChanged', (data) => {
      this.eventHandlers.statusChange.forEach(handler => handler(data));
    });

    this.socket.on('userTyping', (data) => {
      this.eventHandlers.typing.forEach(handler => handler(data));
    });

    this.socket.on('error', (error) => {
      this.eventHandlers.error.forEach(handler => handler(error));
    });

    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => resolve());
      this.socket.on('connect_error', (err) => reject(err));
    });
  }

  // Event subscription methods
  onNewMessage(handler) {
    this.eventHandlers.newMessage.push(handler);
    return () => {
      this.eventHandlers.newMessage = this.eventHandlers.newMessage.filter(h => h !== handler);
    };
  }

  onStatusChange(handler) {
    this.eventHandlers.statusChange.push(handler);
    return () => {
      this.eventHandlers.statusChange = this.eventHandlers.statusChange.filter(h => h !== handler);
    };
  }

  onTyping(handler) {
    this.eventHandlers.typing.push(handler);
    return () => {
      this.eventHandlers.typing = this.eventHandlers.typing.filter(h => h !== handler);
    };
  }

  onError(handler) {
    this.eventHandlers.error.push(handler);
    return () => {
      this.eventHandlers.error = this.eventHandlers.error.filter(h => h !== handler);
    };
  }

  // Chat room methods
  joinChat(chatId) {
    return new Promise((resolve, reject) => {
      this.socket.emit('joinChat', chatId, (response) => {
        if (response.event === 'error') {
          reject(new Error(response.data));
        } else {
          this.currentChatId = chatId;
          resolve(response.data);
        }
      });
    });
  }

  leaveChat(chatId) {
    return new Promise((resolve, reject) => {
      this.socket.emit('leaveChat', chatId, (response) => {
        if (response.event === 'error') {
          reject(new Error(response.data));
        } else {
          this.currentChatId = null;
          resolve(response.data);
        }
      });
    });
  }

  // Message methods
  sendMessage(messageData) {
    return new Promise((resolve, reject) => {
      this.socket.emit('sendMessage', messageData, (response) => {
        if (response.event === 'error') {
          reject(new Error(response.data));
        } else {
          resolve(response.data);
        }
      });
    });
  }

  sendTypingStatus(isTyping) {
    if (!this.currentChatId) return;
    
    this.socket.emit('typing', {
      chatId: this.currentChatId,
      isTyping
    });
  }

  markMessagesAsRead(messageIds) {
    if (!this.currentChatId || !messageIds.length) return;
    
    return new Promise((resolve, reject) => {
      this.socket.emit('readMessages', {
        chatId: this.currentChatId,
        messageIds
      }, (response) => {
        if (response.event === 'error') {
          reject(new Error(response.data));
        } else {
          resolve(response.data);
        }
      });
    });
  }

  // Utility methods
  getActiveUsers(chatId) {
    return new Promise((resolve, reject) => {
      this.socket.emit('getActiveUsers', chatId, (response) => {
        if (response.event === 'error') {
          reject(new Error(response.data));
        } else {
          resolve(response.data.userIds);
        }
      });
    });
  }

  // RESTful API methods using fetch
  async createChat(initialMessage) {
    const response = await fetch(`${this.apiBaseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ initialMessage })
    });

    if (!response.ok) {
      throw new Error(`Failed to create chat: ${response.statusText}`);
    }

    return response.json();
  }

  async getChatHistory(chatId, page = 1, limit = 20) {
    const response = await fetch(`${this.apiBaseUrl}/chat/${chatId}/messages?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get chat history: ${response.statusText}`);
    }

    return response.json();
  }

  async updateChatStatus(chatId, status) {
    const response = await fetch(`${this.apiBaseUrl}/chat/${chatId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error(`Failed to update chat status: ${response.statusText}`);
    }

    return response.json();
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Usage example
async function initChat() {
  const chatService = new ChatService('https://api.example.com', 'your-jwt-token');
  
  try {
    await chatService.connect();
    console.log('Connected to chat service');
    
    // Subscribe to events
    const unsubscribeNewMessage = chatService.onNewMessage((message) => {
      console.log('New message:', message);
      updateChatUI(message);
    });
    
    // Join a chat
    const chat = await chatService.joinChat('chat-uuid');
    displayChatHistory(chat.messages);
    
    // Send a message
    document.getElementById('send-button').addEventListener('click', async () => {
      const messageText = document.getElementById('message-input').value;
      if (!messageText.trim()) return;
      
      try {
        await chatService.sendMessage({
          chatId: 'chat-uuid',
          text: messageText
        });
        document.getElementById('message-input').value = '';
      } catch (error) {
        console.error('Failed to send message:', error);
        showErrorToast(error.message);
      }
    });
    
    // Handle typing indicators
    let typingTimeout;
    document.getElementById('message-input').addEventListener('input', () => {
      chatService.sendTypingStatus(true);
      
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        chatService.sendTypingStatus(false);
      }, 3000);
    });
    
    // Cleanup on component unmount
    return () => {
      unsubscribeNewMessage();
      chatService.disconnect();
    };
  } catch (error) {
    console.error('Chat initialization failed:', error);
    showErrorToast('Failed to connect to chat service');
  }
}
```

### Implementation Tips

1. **Connection Management**:
   - Implement reconnection logic if the connection is lost
   - Store messages locally when offline and resend when connection is restored
   - Handle token expiration and refresh

2. **UI Considerations**:
   - Show typing indicators with debounce
   - Display message status (sent, delivered, read)
   - Provide visual feedback for connection status
   - Implement progressive loading for chat history

3. **Error Recovery**:
   - Retry failed message sends
   - Fallback to REST API if WebSocket is unavailable
   - Log errors for debugging

4. **Performance**:
   - Implement message batching for fast typing
   - Use pagination for large chat histories
   - Optimize rendering for long conversations 

## Swagger Documentation

The chat system provides Swagger documentation for both REST API endpoints and WebSocket events. The WebSocket documentation is available under the "WebSockets" tag in the Swagger UI.

### Accessing WebSocket Documentation

1. Open the API documentation at `/api` (e.g., https://your-api-domain.com/api)
2. Navigate to the "WebSockets" section

### WebSocket Endpoints Documentation

The WebSocket documentation includes:

- Connection instructions with authentication
- Client-to-server events with payload schemas
- Server-to-client event descriptions with response schemas
- Error handling information

Note that although WebSocket endpoints are displayed as regular HTTP endpoints in Swagger, they should only be accessed via WebSockets using the Socket.IO client. Each endpoint includes example code showing how to use it with Socket.IO.

### Example From Swagger

For the "Join Chat" WebSocket event, the Swagger documentation shows:

```javascript
// Client-side code example
socket.emit('join-chat', 'chat-uuid', (response) => {
  if (response.event === 'error') {
    console.error('Error:', response.data);
  } else {
    console.log('Success:', response.data);
  }
});
```

The Swagger UI also displays the expected response format:

```json
{
  "event": "joinedChat",
  "data": {
    "chatId": "chat-uuid",
    "messages": {
      "data": [
        // array of messages
      ],
      "meta": {
        "total": 100,
        "page": 1,
        "limit": 20,
        "totalPages": 5
      }
    }
  }
}
```

### Testing WebSocket Events

While you cannot directly test WebSocket events through Swagger UI, the documentation provides all the information needed to implement client-side code using Socket.IO.

For testing during development, we recommend using tools like:
- [Socket.IO Client Tool](https://amritb.github.io/socketio-client-tool/) - Browser-based testing tool
- [Postman](https://www.postman.com/) - Supports WebSocket testing in recent versions
- Custom test clients built with Socket.IO client library

Remember that all WebSocket connections require authentication with a valid JWT token, the same one used for REST API authentication. 