import { Module } from '@nestjs/common';

import { NotificationModule } from '../notifications/notification.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [NotificationModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
