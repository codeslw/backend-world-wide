import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
    type: Number,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'University with identifier abc123 not found',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'Error type',
    example: 'Not Found',
    type: String,
  })
  error: string;

  @ApiProperty({
    description: 'Additional error details (when applicable)',
    example: { name: ['Name is required'] },
    required: false,
    type: Object,
  })
  details?: Record<string, any>;
}
