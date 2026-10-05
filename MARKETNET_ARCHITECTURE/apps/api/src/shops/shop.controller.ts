import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UpdateShopStatusDto } from './dto/update-shop-status.dto';
import { ShopService } from './shop.service';

@Controller('shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Public()
  @Get()
  listPublicShops() {
    return this.shopService.listPublicShops();
  }

  @Get('me')
  @Roles('merchant', 'admin')
  @Permissions('shops.manage.own')
  getMyShops(@CurrentUser() user: any) {
    return this.shopService.getOwnedShops(user.id);
  }

  @Public()
  @Get(':id')
  getShop(@CurrentUser() user: any, @Param('id') id: string) {
    return this.shopService.getShopByIdForUser(user ?? null, id);
  }

  @Post()
  @Roles('merchant', 'admin')
  @Permissions('shops.manage.own')
  createShop(@CurrentUser() user: any, @Body() dto: CreateShopDto) {
    return this.shopService.createShop(user.id, dto);
  }

  @Patch(':id')
  @Roles('merchant', 'admin')
  @Permissions('shops.manage.own')
  updateShop(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateShopDto) {
    return this.shopService.updateShop(user, id, dto);
  }

  @Patch(':id/status')
  @Roles('merchant', 'admin')
  @Permissions('shops.manage.own')
  updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateShopStatusDto) {
    return this.shopService.updateStatus(user, id, dto.status);
  }
}
