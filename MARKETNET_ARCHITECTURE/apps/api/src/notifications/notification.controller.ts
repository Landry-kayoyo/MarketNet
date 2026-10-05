import { Controller, Get, Param, Patch, Query } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Roles('merchant', 'admin')
  @Permissions('notifications.manage.own')
  listNotifications(@CurrentUser() user: any, @Query('unreadOnly') unreadOnly?: string) {
    return this.notificationService.listNotificationsForUser(user, unreadOnly === 'true');
  }

  @Get(':id')
  @Roles('merchant', 'admin')
  @Permissions('notifications.manage.own')
  getNotification(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationService.getNotificationForUser(user, id);
  }

  @Patch(':id/read')
  @Roles('merchant', 'admin')
  @Permissions('notifications.manage.own')
  markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationService.markNotificationAsRead(user, id);
  }

  @Patch('read-all')
  @Roles('merchant', 'admin')
  @Permissions('notifications.manage.own')
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationService.markAllNotificationsAsRead(user);
  }
}
