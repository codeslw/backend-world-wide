# WebSocket API Documentation

## Overview

This document describes the WebSocket API for real-time chat functionality. The WebSocket server is implemented using Socket.IO and provides real-time messaging capabilities.

## Connection

### Base URL

```
ws://your-api-domain/
```

### Authentication
Authentication is performed using JWT tokens. Provide your token in one of these ways:

## Events

### Client-to-Server Events

#### `joinChat`
Join a specific chat room to receive messages.

**Payload:**
```typescript
string // Chat ID
```

**Response:**
```typescript
{
  event: 'joinedChat',
  data: {
    chatId: string,
    messages: Message[] // Recent messages
  }
}
```

#### `leaveChat`
Leave a chat room.

**Payload:**
```typescript
string // Chat ID
```

**Response:**
```typescript
{
  event: 'leftChat',
  data: string // Chat ID
}
```

#### `sendMessage`
Send a message to a chat.

**Payload:**
```typescript
{
  chatId: string,
  message: {
    text?: string,
    fileId?: string,
    replyToId?: string
  }
}
```

**Response:**
```typescript
{
  event: 'messageSent',
  data: Message // The created message
}
```

#### `typing`
Indicate that the user is typing.

**Payload:**
```typescript
{
  chatId: string,
  isTyping: boolean
}
```

#### `readMessages`
Mark messages as read.

**Payload:**
```typescript
{
  chatId: string,
  messageIds: string[]
}
```

**Response:**
```typescript
{
  event: 'messagesMarkedRead',
  data: { id: string, readBy: number }[]
}
```

#### `getActiveUsers`
Get users currently active in a chat.

**Payload:**
```typescript
string // Chat ID
```

**Response:**
```typescript
{
  event: 'activeUsers',
  data: {
    chatId: string,
    userIds: number[]
  }
}
```

### Server-to-Client Events

#### `newMessage`
Emitted when a new message is sent to a chat you've joined.

**Payload:**
```typescript:src/chat/websocket-docs.md
Message // The new message object
```

#### `userTyping`
Emitted when a user starts or stops typing.

**Payload:**
```typescript
{
  userId: number,
  email: string,
  isTyping: boolean
}
```

#### `messagesRead`
Emitted when messages are marked as read.

**Payload:**
```typescript
{
  userId: number,
  messageIds: string[]
}
```

#### `participantUpdate`
Emitted when a user joins or leaves a chat.

**Payload:**
```typescript
{
  chatId: string,
  userId: number,
  action: 'joined' | 'left',
  timestamp: string
}
```

#### `chatStatusChanged`
Emitted when a chat's status changes.

**Payload:**
```typescript
{
  chatId: string,
  status: 'ACTIVE' | 'CLOSED' | 'PENDING'
}
```

## Data Types

### Message
```typescript
interface Message {
  id: string;
  chatId: string;
  senderId: number;
  text?: string;
  fileUrl?: string;
  replyToId?: string;
  replyTo?: Message;
  createdAt: string;
  sender?: {
    id: number;
    email: string;
    role: string;
  };
}
```

### Chat
```typescript
interface Chat {
  id: string;
  clientId: number;
  adminId?: number;
  status: 'ACTIVE' | 'CLOSED' | 'PENDING';
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}
```

## Error Handling

All events can return an error response:

```typescript
{
  event: 'error',
  data: string // Error message
}
```

## Example Usage

```javascript
// Connect to WebSocket server
const socket = io('ws://your-api-domain', {
  auth: { token: 'your-jwt-token' }
});

// Handle connection events
socket.on('connect', () => {
  console.log('Connected to chat server');
  
  // Join a chat room
  socket.emit('joinChat', 'chat-id-123', (response) => {
    console.log('Joined chat:', response);
  });
});

// Listen for new messages
socket.on('newMessage', (message) => {
  console.log('New message received:', message);
});

// Send a message
socket.emit('sendMessage', {
  chatId: 'chat-id-123',
  message: {
    text: 'Hello world!'
  }
}, (response) => {
  console.log('Message sent:', response);
});

// Indicate typing
socket.emit('typing', {
  chatId: 'chat-id-123',
  isTyping: true
});

// Handle errors
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Disconnect
socket.on('disconnect', () => {
  console.log('Disconnected from chat server');
});
```