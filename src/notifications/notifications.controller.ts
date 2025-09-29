import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { NotificationCountDto, NotificationSummaryDto } from './dto/notifications-response.dto';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('messages/unread-count')
  @ApiOperation({ summary: 'Get unread chat messages count for the current user' })
  @ApiResponse({ status: 200, description: 'Unread messages count', type: NotificationCountDto })
  async getUnreadMessagesCount(@Request() req): Promise<NotificationCountDto> {
    const { userId, role } = req.user;
    const count = await this.notificationsService.getUnreadMessagesCount(
      userId,
      role,
    );
    return { count };
  }

  @Get('applications/pending-count')
  @ApiOperation({
    summary: 'Get applications count in DRAFT or SUBMITTED status',
  })
  @ApiResponse({ status: 200, description: 'Pending applications count', type: NotificationCountDto })
  async getPendingApplicationsCount(@Request() req): Promise<NotificationCountDto> {
    const { userId, role } = req.user;
    const count = await this.notificationsService.getPendingApplicationsCount(
      userId,
      role,
    );
    return { count };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get combined notifications summary' })
  @ApiResponse({ status: 200, description: 'Notification summary', type: NotificationSummaryDto })
  async getSummary(@Request() req): Promise<NotificationSummaryDto> {
    const { userId, role } = req.user;
    return this.notificationsService.getSummary(userId, role);
  }
}
