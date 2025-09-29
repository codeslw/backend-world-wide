import { ApiProperty } from '@nestjs/swagger';

export class NotificationCountDto {
  @ApiProperty({ example: 3 })
  count: number;
}

export class NotificationSummaryDto {
  @ApiProperty({ example: 5 })
  unreadMessages: number;

  @ApiProperty({ example: 2 })
  pendingApplications: number;
}
