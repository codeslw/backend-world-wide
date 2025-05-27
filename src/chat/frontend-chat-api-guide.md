# Frontend Chat API Integration Guide

## 1. Introduction

This guide provides frontend developers with the necessary information to integrate the chat functionalities of the application. It covers both the REST API for managing chat sessions and messages, and the WebSocket API for real-time communication.

## 2. Prerequisites

### API Base URLs

*   **REST API Base URL:** `https://api.example.com/chat`
*   **WebSocket URL:** `wss://api.example.com` (The path for WebSocket connection might vary, often it's the root or a specific namespace like `/chat`)

Replace `api.example.com` with your actual API domain. Use `wss://` for secure WebSocket connections, analogous to `https://`.

## 3. Authentication

Both REST API calls and WebSocket connections require JWT-based authentication.

### REST API Authentication

Include your JWT token in the `Authorization` header for every REST API request:

```
Authorization: Bearer your-jwt-token
```

### WebSocket Authentication

Provide your JWT token when establishing the WebSocket connection. For Socket.IO, this is typically done via the `auth` option:

```javascript
const socket = io('wss://api.example.com', { // Or your specific WebSocket namespace
  auth: {
    token: 'your-jwt-token'
  }
});
```

## 4. Core Data Types

These are the primary data structures you'll work with.

### Chat

Represents a chat session.

```typescript
interface Chat {
  id: string; // UUID
  clientId: number; // ID of the client user
  adminId?: number; // ID of the admin user, if assigned
  status: 'ACTIVE' | 'CLOSED' | 'PENDING'; // Status of the chat
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  messages?: Message[]; // Array of messages, usually included in detailed views or specific requests
}
```

### Message

Represents a single message within a chat.

```typescript
interface Message {
  id: string; // UUID
  chatId: string; // UUID of the chat this message belongs to
  senderId: number; // ID of the user who sent the message
  text?: string; // Text content of the message
  fileUrl?: string; // URL to an attached file, if any
  replyToId?: string; // UUID of the message this is a reply to, if any
  replyTo?: Message; // The message being replied to (often included when fetching messages)
  createdAt: string; // ISO 8601 timestamp
  sender?: { // Information about the sender
    id: number;
    email: string;
    role: string; // e.g., 'CLIENT', 'ADMIN'
  };
}
```

## 5. REST API Endpoints

All REST endpoints are relative to the **REST API Base URL**: `https://api.example.com/chat`.

### Common DTOs

#### CreateChatDto
```typescript
interface CreateChatDto {
  initialMessage?: string; // Optional initial message to start the chat with
}
```

#### CreateMessageDto (for `POST /chat/:id/messages`)
```typescript
interface CreateMessageDto {
  text?: string; // Text content of the message
  fileId?: string; // ID of a previously uploaded file to attach
  replyToId?: string; // UUID of the message this is a reply to
}
```

#### UpdateChatStatusDto
```typescript
interface UpdateChatStatusDto {
  status: 'ACTIVE' | 'CLOSED' | 'PENDING';
}
```

### Endpoints

#### 5.1. Create a New Chat

Creates a new chat for the authenticated user.

*   **Endpoint:** `POST /`
*   **Request Body:** `CreateChatDto`
    ```json
    {
      "initialMessage": "Hello, I need assistance with my application."
    }
    ```
*   **Response:** `201 Created` - Returns the newly created `Chat` object, including the initial message.
    ```json
    {
      "id": "uuid-string",
      "clientId": 123,
      "adminId": null,
      "status": "ACTIVE",
      "createdAt": "2023-06-15T10:30:00Z",
      "updatedAt": "2023-06-15T10:30:00Z",
      "messages": [
        {
          "id": "message-uuid",
          "chatId": "uuid-string",
          "senderId": 123,
          "text": "Hello, I need assistance with my application.",
          "fileUrl": null,
          "replyToId": null,
          "createdAt": "2023-06-15T10:30:00Z"
        }
      ]
    }
    ```

#### 5.2. Get User's Chats

Retrieves all chats for the authenticated user.

*   **Endpoint:** `GET /`
*   **Query Parameters:**
    *   `status` (optional): Filter by chat status (`ACTIVE`, `CLOSED`, `PENDING`).
*   **Response:** `200 OK` - Returns an array of `Chat` objects.
    ```json
    [
      {
        "id": "uuid-string",
        "clientId": 123,
        // ... other chat properties ...
        "messages": [ /* latest messages or summary */ ]
      }
    ]
    ```

#### 5.3. Get All Chats (Admin Only)

Retrieves all chats in the system. Requires admin privileges.

*   **Endpoint:** `GET /admin`
*   **Query Parameters:**
    *   `status` (optional): Filter by chat status (`ACTIVE`, `CLOSED`, `PENDING`).
*   **Response:** `200 OK` - Returns an array of `Chat` objects.

#### 5.4. Get Chat by ID

Retrieves a specific chat by its ID.

*   **Endpoint:** `GET /:id` (where `:id` is the chat UUID)
*   **Response:** `200 OK` - Returns the `Chat` object, usually including recent messages.
    ```json
    {
      "id": "uuid-string",
      "clientId": 123,
      // ... other chat properties ...
      "messages": [ /* messages for this chat */ ]
    }
    ```

#### 5.5. Assign Admin to Chat (Admin Only)

Assigns the authenticated admin to a chat. Requires admin privileges.

*   **Endpoint:** `PATCH /:id/assign` (where `:id` is the chat UUID)
*   **Response:** `200 OK` - Returns the updated `Chat` object.
    ```json
    {
      "id": "uuid-string",
      "clientId": 123,
      "adminId": 456, // ID of the assigned admin
      "status": "ACTIVE",
      "createdAt": "2023-06-15T10:30:00Z",
      "updatedAt": "2023-06-15T10:30:05Z"
    }
    ```

#### 5.6. Update Chat Status

Updates the status of a chat (e.g., to close it). Typically accessible by the client for their own chats, or by an admin.

*   **Endpoint:** `PATCH /:id/status` (where `:id` is the chat UUID)
*   **Request Body:** `UpdateChatStatusDto`
    ```json
    {
      "status": "CLOSED"
    }
    ```
*   **Response:** `200 OK` - Returns the updated `Chat` object.
    ```json
    {
      "id": "uuid-string",
      "clientId": 123,
      "adminId": 456,
      "status": "CLOSED",
      "createdAt": "2023-06-15T10:30:00Z",
      "updatedAt": "2023-06-15T10:30:15Z"
    }
    ```

#### 5.7. Send Message to Chat

Sends a new message to a specific chat.

*   **Endpoint:** `POST /:id/messages` (where `:id` is the chat UUID)
*   **Request Body:** `CreateMessageDto`
    ```json
    {
      "text": "This is a response to your inquiry.",
      "fileId": "optional-file-uuid",
      "replyToId": "optional-message-uuid-to-reply-to"
    }
    ```
*   **Response:** `201 Created` - Returns the newly created `Message` object.
    ```json
    {
      "id": "new-message-uuid",
      "chatId": "uuid-string", // The :id from the path
      "senderId": 456, // ID of the sender (current user)
      "text": "This is a response to your inquiry.",
      "fileUrl": "https://presigned-url.com/file.pdf", // If fileId was provided and resolved
      "replyToId": "message-uuid",
      "createdAt": "2023-06-15T10:35:00Z",
      "replyTo": { /* The message object being replied to, if applicable */ },
      "sender": { /* Sender's user details */ }
    }
    ```

#### 5.8. Get Chat Messages

Retrieves messages for a specific chat with pagination.

*   **Endpoint:** `GET /:id/messages` (where `:id` is the chat UUID)
*   **Query Parameters:**
    *   `page` (optional): Page number (default: 1).
    *   `limit` (optional): Items per page (default: 20).
*   **Response:** `200 OK` - Returns a paginated list of `Message` objects.
    ```json
    {
      "data": [
        {
          "id": "message-uuid-1",
          // ... message properties ...
        },
        {
          "id": "message-uuid-2",
          // ... message properties ...
        }
      ],
      "meta": {
        "total": 100, // Total number of messages in the chat
        "page": 1,
        "limit": 20,
        "totalPages": 5
      }
    }
    ```

### Common Error Responses

*   **400 Bad Request:** Validation failed or malformed request.
    ```json
    {
      "statusCode": 400,
      "message": "Validation failed",
      "error": "Bad Request"
    }
    ```
*   **401 Unauthorized:** JWT token is missing, invalid, or expired.
    ```json
    {
      "statusCode": 401,
      "message": "Unauthorized",
      "error": "Unauthorized"
    }
    ```
*   **403 Forbidden:** Authenticated user does not have permission to access the resource.
    ```json
    {
      "statusCode": 403,
      "message": "You do not have access to this chat",
      "error": "Forbidden"
    }
    ```
*   **404 Not Found:** The requested resource (e.g., chat or message) was not found.
    ```json
    {
      "statusCode": 404,
      "message": "Chat with ID uuid-string not found",
      "error": "Not Found"
    }
    ```

## 6. WebSocket API

The WebSocket API enables real-time communication for features like receiving new messages, typing indicators, and presence updates. Connect to the **WebSocket URL**: `wss://api.example.com`.

### Connection & Authentication

Establish a connection as described in Section 3 (Authentication).

### Client-to-Server Events

These are events your client will emit to the server. For acknowledgment/response, Socket.IO callbacks can be used.

#### `joinChat`

Join a specific chat room to send and receive messages for that chat.

*   **Event Name:** `joinChat`
*   **Payload:** `string` (The Chat ID to join)
    ```typescript
    // Example: socket.emit('joinChat', 'chat-uuid-123', (response) => { /* handle response */ });
    ```
*   **Server Acknowledgment (Example):**
    ```typescript
    {
      event: 'joinedChat', // Or simply a success status in the callback
      data: {
        chatId: string, // The ID of the chat joined
        messages: Message[] // Optionally, recent messages from the chat
      }
    }
    ```

#### `leaveChat`

Leave a chat room.

*   **Event Name:** `leaveChat`
*   **Payload:** `string` (The Chat ID to leave)
    ```typescript
    // Example: socket.emit('leaveChat', 'chat-uuid-123', (response) => { /* handle response */ });
    ```
*   **Server Acknowledgment (Example):**
    ```typescript
    {
      event: 'leftChat', // Or a success status
      data: string // Chat ID left
    }
    ```

#### `sendMessage`

Send a message to a chat. The user must have joined the chat room first.

*   **Event Name:** `sendMessage`
*   **Payload:**
    ```typescript
    {
      chatId: string, // The ID of the chat to send the message to
      message: {
        text?: string,
        fileId?: string, // ID of a previously uploaded file
        replyToId?: string // ID of the message being replied to
      }
    }
    ```
*   **Server Acknowledgment (Example):** Contains the created `Message` object.
    ```typescript
    {
      event: 'messageSent', // Or the Message object directly in callback
      data: Message // The successfully sent message, fully formed
    }
    ```

#### `typing`

Indicate that the current user is typing or has stopped typing in a chat.

*   **Event Name:** `typing`
*   **Payload:**
    ```typescript
    {
      chatId: string,
      isTyping: boolean // true if typing, false if stopped
    }
    ```
    (This event is often fire-and-forget, no specific acknowledgment needed beyond broadcasting to others)

#### `readMessages`

Mark messages as read by the current user in a specific chat.

*   **Event Name:** `readMessages`
*   **Payload:**
    ```typescript
    {
      chatId: string,
      messageIds: string[] // Array of message IDs that have been read
    }
    ```
*   **Server Acknowledgment (Example):**
    ```typescript
    {
      event: 'messagesMarkedRead',
      data: { id: string, readBy: number }[] // Confirmation of messages marked read, possibly with user ID
    }
    ```

#### `getActiveUsers` (Optional Feature)

Request a list of users currently active in a specific chat room.

*   **Event Name:** `getActiveUsers`
*   **Payload:** `string` (Chat ID)
*   **Server Acknowledgment (Example):**
    ```typescript
    {
      event: 'activeUsers',
      data: {
        chatId: string,
        userIds: number[] // Array of user IDs active in the chat
      }
    }
    ```

### Server-to-Client Events

These are events your client will listen for from the server.

#### `newMessage`

Emitted when a new message is sent to a chat room your client has joined.

*   **Event Name:** `newMessage`
*   **Payload:** `Message` (The new message object, as defined in Section 4)

#### `userTyping`

Emitted when another user in a joined chat room starts or stops typing.

*   **Event Name:** `userTyping`
*   **Payload:**
    ```typescript
    {
      chatId: string, // The chat where typing is happening
      userId: number, // ID of the user who is typing
      email: string,  // Email or identifier of the typing user (optional, for display)
      isTyping: boolean // true if typing, false if stopped
    }
    ```

#### `messagesRead`

Emitted when messages in a chat have been marked as read by a user.

*   **Event Name:** `messagesRead`
*   **Payload:**
    ```typescript
    {
      chatId: string,
      userId: number, // User who read the messages
      messageIds: string[] // IDs of messages that were read
    }
    ```

#### `participantUpdate`

Emitted when a user joins or leaves a chat room you are in.

*   **Event Name:** `participantUpdate`
*   **Payload:**
    ```typescript
    {
      chatId: string,
      userId: number,
      action: 'joined' | 'left',
      timestamp: string // ISO 8601 timestamp of the event
    }
    ```

#### `chatStatusChanged`

Emitted when the status of a chat you are involved in changes (e.g., from 'ACTIVE' to 'CLOSED').

*   **Event Name:** `chatStatusChanged`
*   **Payload:**
    ```typescript
    {
      chatId: string,
      status: 'ACTIVE' | 'CLOSED' | 'PENDING'
    }
    ```

### WebSocket Error Handling

Generic errors on the WebSocket connection or related to specific events might be emitted via a standard `error` event, or as part of an acknowledgment callback for an emitted event.

*   **Event Name:** `error`
*   **Payload (Example):**
    ```typescript
    {
      event: 'error', // Or could be an error object in an emit callback
      data: string | { message: string, code?: string } // Error message or object
    }
    ```
    Consult your Socket.IO client library for specific error handling patterns in callbacks.

## 7. Example WebSocket Client Usage (Socket.IO)

```javascript
import { io } from 'socket.io-client';

// Replace with your actual WebSocket URL and token
const WS_URL = 'wss://api.example.com'; 
const JWT_TOKEN = 'your-jwt-token';

const socket = io(WS_URL, {
  auth: {
    token: JWT_TOKEN
  },
  transports: ['websocket'] // Recommended for modern browsers
});

socket.on('connect', () => {
  console.log('Successfully connected to WebSocket server. Socket ID:', socket.id);

  // Example: Join a chat after connection
  const chatIdToJoin = 'some-chat-uuid';
  socket.emit('joinChat', chatIdToJoin, (response) => {
    if (response && response.data && response.data.chatId === chatIdToJoin) {
      console.log(`Successfully joined chat: ${response.data.chatId}`);
      // Handle initial messages if provided: response.data.messages
    } else {
      console.error('Failed to join chat or unexpected response:', response);
    }
  });
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from WebSocket server:', reason);
  if (reason === 'io server disconnect') {
    // The server explicitly disconnected the socket, e.g., auth failure
    socket.connect(); // Attempt to reconnect if appropriate
  }
  // Else, the socket will automatically try to reconnect for other reasons
});

socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
  // This can happen due to network issues, server down, or auth problems before connection is established.
});

// Listening for server-sent events
socket.on('newMessage', (message) => {
  console.log('New message received:', message);
  // Update your UI with the new message
});

socket.on('userTyping', (typingInfo) => {
  console.log(`User ${typingInfo.userId} is ${typingInfo.isTyping ? 'typing' : 'stopped typing'} in chat ${typingInfo.chatId}`);
  // Update UI to show typing indicator
});

socket.on('messagesRead', (readInfo) => {
  console.log(`Messages ${readInfo.messageIds.join(', ')} read by user ${readInfo.userId} in chat ${readInfo.chatId}`);
  // Update UI to reflect messages read status
});

socket.on('participantUpdate', (update) => {
  console.log(`User ${update.userId} ${update.action} chat ${update.chatId}`);
  // Update participant list or UI notices
});

socket.on('chatStatusChanged', (statusUpdate) => {
  console.log(`Chat ${statusUpdate.chatId} status changed to ${statusUpdate.status}`);
  // Update UI based on new chat status
});

socket.on('error', (error) => { // General error event from server
  console.error('Received server error event:', error);
});


// Example: Sending a message
function sendMessage(chatId, textContent) {
  const messagePayload = {
    chatId: chatId,
    message: {
      text: textContent
    }
  };
  socket.emit('sendMessage', messagePayload, (response) => {
    // This callback receives the acknowledgment from the server
    if (response && response.data && response.data.id) {
      console.log('Message sent and acknowledged:', response.data);
      // The response.data should be the full Message object
    } else {
      console.error('Message sending failed or unexpected acknowledgment:', response);
    }
  });
}

// Example: Indicating typing
function sendTypingIndicator(chatId, isTyping) {
  socket.emit('typing', { chatId, isTyping });
}

// Make sure to handle cleanup, e.g., socket.disconnect() when component unmounts or user logs out.
``` 