import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

export const WebSocketDoc = (options: { summary: string; description?: string }) => {
  const description = `
${options.description || 'This is a WebSocket endpoint, not a REST endpoint.'}

## WebSocket Usage
This endpoint is accessed via WebSockets using Socket.IO.

\`\`\`javascript
// Client-side code example
socket.emit('${options.summary.toLowerCase().replace(/[\[\]\s]+/g, '-').replace(/[^a-z0-9-]/g, '')}', payload, (response) => {
  if (response.event === 'error') {
    console.error('Error:', response.data);
  } else {
    console.log('Success:', response.data);
  }
});
\`\`\`

> ⚠️ Note: This documentation is for WebSockets. Do not attempt to call this endpoint using HTTP.
`;

  return applyDecorators(
    ApiOperation({
      summary: `[WebSocket] ${options.summary}`,
      description: description,
    }),
  );
}; 