# Chat System Updates

This document outlines recent improvements to the chat system and how frontend developers should adapt their implementations.

## New Features

### 1. Message Read Status Tracking

Messages now track which users have read them, enabling:

- Unread message counts per chat
- Read receipts at the message level
- Real-time read status notifications

### 2. Improved Chat Status Management

- Chats now default to `PENDING` status when created
- Automatically transition to `ACTIVE` when an admin is assigned
- Closed chats cannot be reopened (prevents status cycling)

### 3. Admin Assignment Notifications

- Real-time notifications when an admin is assigned to a chat
- Includes the assigned admin's ID for UI updates

### 4. Enhanced Error Handling

- More specific error messages for file attachments
- Validation for reply messages (must exist and belong to the same chat)
- Better handling of invalid status transitions

## API Changes

### New WebSocket Events

| Event | Payload | Description |
|-------|---------|-------------|
| `adminAssigned` | `{ chatId: string, adminId: string }` | Sent when an admin is assigned to a chat |
| `messagesRead` | `{ userId: string, messageIds: string[] }` | Sent when a user reads messages |

### REST API Response Updates

#### GET /chat (User's chats)

Now includes an `unreadCount` property for each chat:

```json
[
  {
    "id": "chat-uuid",
    "status": "ACTIVE",
    "client": { /* client data */ },
    "admin": { /* admin data */ },
    "messages": [ /* most recent message */ ],
    "unreadCount": 5  // <- New property
  }
]
```

#### GET /chat/:id/messages

Messages now include a `readBy` array with user IDs:

```json
{
  "data": [
    {
      "id": "message-uuid",
      "text": "Hello",
      "sender": { /* sender data */ },
      "createdAt": "2023-01-01T12:00:00Z",
      "readBy": [
        { "id": "user-uuid" }
      ]
    }
  ],
  "meta": { /* pagination data */ }
}
```

## Implementation Requirements

### Fetching Unread Count

The unread count is now automatically included in the chat list response. Use this to update your UI:

```javascript
// Example: Displaying unread count in chat list
function renderChatList(chats) {
  return chats.map(chat => `
    <div class="chat-item ${chat.status.toLowerCase()}">
      <div class="chat-details">
        <h3>${chat.client.profile?.firstName || chat.client.email}</h3>
        <p>${chat.messages[0]?.text || 'No messages yet'}</p>
      </div>
      ${chat.unreadCount ? `<span class="unread-badge">${chat.unreadCount}</span>` : ''}
    </div>
  `).join('');
}
```

### Tracking Read Status

Messages are automatically marked as read when they are fetched through the API. For better user experience, explicitly mark messages as read when they are visible in the viewport:

```javascript
// Example: Mark messages as read when visible
function markVisibleMessagesAsRead(chatId) {
  const visibleMessageElements = document.querySelectorAll('.message.unread:in-viewport');
  const messageIds = Array.from(visibleMessageElements).map(el => el.dataset.messageId);
  
  if (messageIds.length > 0) {
    chatService.markMessagesAsRead(messageIds);
  }
}

// Call this function on scroll events or when chat is opened
document.querySelector('.chat-messages').addEventListener('scroll', () => {
  markVisibleMessagesAsRead(currentChatId);
});
```

### Handling Admin Assignment

Listen for the new `adminAssigned` event to update your UI when an admin joins the chat:

```javascript
chatService.socket.on('adminAssigned', (data) => {
  // Update the chat admin information
  updateChatAdminInfo(data.chatId, data.adminId);
  
  // Show notification to the user
  showNotification(`An administrator has joined the chat`);
  
  // Update the chat status indicator if needed
  updateChatStatusIndicator(data.chatId, 'ACTIVE');
});
```

### Displaying Read Receipts

Use the `messagesRead` event to update read status in real-time:

```javascript
chatService.socket.on('messagesRead', (data) => {
  const { userId, messageIds } = data;
  
  // Update read status indicators in the UI
  messageIds.forEach(messageId => {
    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.querySelector('.read-status').textContent = 'Read';
      messageElement.classList.remove('unread');
    }
  });
  
  // Update read indicator in the message list
  updateReadIndicators(userId, messageIds);
});
```

## Migration Guide

1. Update your socket event listeners to handle the new events
2. Modify your chat list UI to display unread counts
3. Implement read status indicators in your message components
4. Update any status-related logic to handle the new status transition rules
5. Test all chat flows, particularly focusing on read receipts and admin assignments

## Testing Recommendations

- Test chat creation and automatic pending status
- Verify admin assignment and automatic transition to active status
- Check read status updates in real-time across multiple devices
- Validate unread counts when returning to the chat list
- Test error cases like attempting to reopen a closed chat

For any questions or issues, please contact the backend team. 