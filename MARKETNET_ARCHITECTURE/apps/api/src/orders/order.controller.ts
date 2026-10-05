import { Body, Controller, Post } from '@nestjs/common';

import { Public } from '../auth/decorators/public.decorator';
import { CreateGuestOrderDto } from './dto/create-guest-order.dto';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ── Commande invité (PUBLIQUE — aucun compte requis) ──
  @Public()
  @Post('guest')
  guestCheckout(@Body() dto: CreateGuestOrderDto) {
    return this.orderService.guestCheckout(dto);
  }
}
