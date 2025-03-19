import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

export const WebSocketDoc = (options: { summary: string; description?: string }) => {
  return applyDecorators(
    ApiOperation({
      summary: `[WebSocket] ${options.summary}`,
      description: options.description || 'This is a WebSocket endpoint, not a REST endpoint.',
    }),
  );
}; 