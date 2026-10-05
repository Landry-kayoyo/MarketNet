import { Module } from '@nestjs/common';

import { NotificationModule } from '../notifications/notification.module';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

@Module({
  imports: [NotificationModule],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
