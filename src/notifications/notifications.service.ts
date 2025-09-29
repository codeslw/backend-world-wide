import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { Role as AppRole } from '../common/enum/roles.enum';
import { ApplicationStatus, Prisma, Role as PrismaRole } from '@prisma/client';

export interface NotificationSummary {
  unreadMessages: number;
  pendingApplications: number;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Counts unread chat messages for the current user.
   * Admins additionally see messages from unassigned chats so they can react.
   */
  async getUnreadMessagesCount(
    userId: string,
    role: AppRole,
  ): Promise<number> {
    const prismaRole = role as PrismaRole;
    const isClient = prismaRole === PrismaRole.CLIENT;
    const isAdmin = prismaRole === PrismaRole.ADMIN;

    const chatFilter: Prisma.ChatWhereInput = isClient
      ? { clientId: userId }
      : {
          OR: [
            { adminId: userId },
            ...(isAdmin ? [{ adminId: null }] : []),
          ],
        };

    const messageWhere: Prisma.MessageWhereInput = {
      chat: chatFilter,
      senderId: { not: userId },
      ...(isClient ? { readByClient: false } : { readByAdmin: false }),
    };

    return this.prisma.message.count({ where: messageWhere });
  }

  /**
   * Counts applications in DRAFT or SUBMITTED state.
   * Clients only see their own applications; admins see everything.
   */
  async getPendingApplicationsCount(
    userId: string,
    role: AppRole,
  ): Promise<number> {
    const statuses: ApplicationStatus[] = [
      ApplicationStatus.DRAFT,
      ApplicationStatus.SUBMITTED,
    ];

    if (role === AppRole.CLIENT) {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!profile) {
        return 0;
      }

      return this.prisma.application.count({
        where: {
          profileId: profile.id,
          applicationStatus: { in: statuses },
        },
      });
    }

    return this.prisma.application.count({
      where: {
        applicationStatus: { in: statuses },
      },
    });
  }

  /**
   * Convenience helper that resolves both counts in parallel.
   */
  async getSummary(userId: string, role: AppRole): Promise<NotificationSummary> {
    const [unreadMessages, pendingApplications] = await Promise.all([
      this.getUnreadMessagesCount(userId, role),
      this.getPendingApplicationsCount(userId, role),
    ]);

    return { unreadMessages, pendingApplications };
  }
}
