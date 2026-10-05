import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageService } from './message.service';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  @Roles('merchant', 'admin')
  @Permissions('messages.manage.own')
  listMessages(
    @CurrentUser() user: any,
    @Query('shopId') shopId?: string,
    @Query('orderId') orderId?: string,
  ) {
    return this.messageService.listMessagesForUser(user, { shopId, orderId });
  }

  @Get('conversations/:userId')
  @Roles('merchant', 'admin')
  @Permissions('messages.manage.own')
  getConversation(
    @CurrentUser() user: any,
    @Param('userId') otherUserId: string,
    @Query('shopId') shopId?: string,
    @Query('orderId') orderId?: string,
  ) {
    return this.messageService.getConversationForUser(user, otherUserId, { shopId, orderId });
  }

  @Get(':id')
  @Roles('merchant', 'admin')
  @Permissions('messages.manage.own')
  getMessage(@CurrentUser() user: any, @Param('id') id: string) {
    return this.messageService.getMessageForUser(user, id);
  }

  @Post()
  @Roles('merchant', 'admin')
  @Permissions('messages.manage.own')
  createMessage(@CurrentUser() user: any, @Body() dto: CreateMessageDto) {
    return this.messageService.createMessage(user, dto);
  }

  @Patch(':id/read')
  @Roles('merchant', 'admin')
  @Permissions('messages.manage.own')
  markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.messageService.markMessageAsRead(user, id);
  }
}
