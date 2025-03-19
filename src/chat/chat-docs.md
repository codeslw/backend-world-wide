# Chat REST API Documentation

## Overview

This document describes the REST API endpoints for the chat functionality. These endpoints allow users to create and manage chats, send messages, and retrieve chat history.

## Authentication

All endpoints require authentication using JWT tokens. Include your token in the Authorization header:

```
Authorization: Bearer your-jwt-token
```

## Base URL

```
https://your-api-domain/chat
```

## Endpoints

### Create a New Chat

Creates a new chat for the authenticated user.

**Endpoint:** `POST /chat`

**Request Body:**
```json
{
  "initialMessage": "Hello, I need assistance with my application."
}
```

**Response:** `201 Created`
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

### Get User's Chats

Retrieves all chats for the authenticated user.

**Endpoint:** `GET /chat`

**Query Parameters:**
- `status` (optional): Filter by chat status (`ACTIVE`, `CLOSED`, `PENDING`)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid-string",
    "clientId": 123,
    "adminId": 456,
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
]
```

### Get All Chats (Admin Only)

Retrieves all chats in the system (admin access only).

**Endpoint:** `GET /chat/admin`

**Query Parameters:**
- `status` (optional): Filter by chat status (`ACTIVE`, `CLOSED`, `PENDING`)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid-string",
    "clientId": 123,
    "adminId": 456,
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
]
```

### Get Chat by ID

Retrieves a specific chat by its ID.

**Endpoint:** `GET /chat/:id`

**Response:** `200 OK`
```json
{
  "id": "uuid-string",
  "clientId": 123,
  "adminId": 456,
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

### Assign Admin to Chat (Admin Only)

Assigns the authenticated admin to a chat.

**Endpoint:** `PATCH /chat/:id/assign`

**Response:** `200 OK`
```json
{
  "id": "uuid-string",
  "clientId": 123,
  "adminId": 456,
  "status": "ACTIVE",
  "createdAt": "2023-06-15T10:30:00Z",
  "updatedAt": "2023-06-15T10:30:00Z"
}
```

### Update Chat Status

Updates the status of a chat.

**Endpoint:** `PATCH /chat/:id/status`

**Request Body:**
```json
{
  "status": "CLOSED"
}
```

**Response:** `200 OK`
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

### Send Message to Chat

Sends a new message to a chat.

**Endpoint:** `POST /chat/:id/messages`

**Request Body:**
```json
{
  "chatId": "uuid-string",
  "text": "This is a response to your inquiry.",
  "fileId": "file-uuid",
  "replyToId": "message-uuid"
}
```

**Response:** `201 Created`
```json
{
  "id": "new-message-uuid",
  "chatId": "uuid-string",
  "senderId": 456,
  "text": "This is a response to your inquiry.",
  "fileUrl": "https://presigned-url.com/file.pdf",
  "replyToId": "message-uuid",
  "createdAt": "2023-06-15T10:35:00Z",
  "replyTo": {
    "id": "message-uuid",
    "chatId": "uuid-string",
    "senderId": 123,
    "text": "Hello, I need assistance with my application.",
    "fileUrl": null,
    "replyToId": null,
    "createdAt": "2023-06-15T10:30:00Z"
  },
  "sender": {
    "id": 456,
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

### Get Chat Messages

Retrieves messages for a specific chat with pagination.

**Endpoint:** `GET /chat/:id/messages`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "message-uuid-1",
      "chatId": "uuid-string",
      "senderId": 123,
      "text": "Hello, I need assistance with my application.",
      "fileUrl": null,
      "replyToId": null,
      "createdAt": "2023-06-15T10:30:00Z"
    },
    {
      "id": "message-uuid-2",
      "chatId": "uuid-string",
      "senderId": 456,
      "text": "This is a response to your inquiry.",
      "fileUrl": "https://presigned-url.com/file.pdf",
      "replyToId": "message-uuid-1",
      "createdAt": "2023-06-15T10:35:00Z",
      "replyTo": {
        "id": "message-uuid-1",
        "chatId": "uuid-string",
        "senderId": 123,
        "text": "Hello, I need assistance with my application.",
        "fileUrl": null,
        "replyToId": null,
        "createdAt": "2023-06-15T10:30:00Z"
      }
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "You do not have access to this chat",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Chat with ID uuid-string not found",
  "error": "Not Found"
}
```

## Data Types

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

### CreateChatDto
```typescript
interface CreateChatDto {
  initialMessage?: string;
}
```

### CreateMessageDto
```typescript
interface CreateMessageDto {
  chatId: string;
  text?: string;
  fileId?: string;
  replyToId?: string;
}
```

### UpdateChatStatusDto
```typescript
interface UpdateChatStatusDto {
  status: 'ACTIVE' | 'CLOSED' | 'PENDING';
}
```
