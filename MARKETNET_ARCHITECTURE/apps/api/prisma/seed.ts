import * as bcrypt from 'bcrypt';
import {
  AnalyticsEventType,
  NotificationType,
  OrderStatus,
  Prisma,
  PrismaClient,
  ProductStatus,
  ShopStatus,
  UserStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  await prisma.analyticsEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productSpecification.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.platformSetting.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

async function ensurePermissions() {
  const permissionMap: Prisma.PermissionCreateManyInput[] = [
    { key: 'users.read.self', resource: 'users', action: 'read', scope: 'USER' },
    { key: 'users.write.self', resource: 'users', action: 'write', scope: 'USER' },
    { key: 'users.read.all', resource: 'users', action: 'read', scope: 'GLOBAL' },
    { key: 'users.write.all', resource: 'users', action: 'write', scope: 'GLOBAL' },
    { key: 'shops.manage.own', resource: 'shops', action: 'manage', scope: 'SHOP' },
    { key: 'shops.manage.all', resource: 'shops', action: 'manage', scope: 'GLOBAL' },
    { key: 'products.manage.own', resource: 'products', action: 'manage', scope: 'PRODUCT' },
    { key: 'products.manage.all', resource: 'products', action: 'manage', scope: 'GLOBAL' },
    { key: 'orders.manage.own', resource: 'orders', action: 'manage', scope: 'ORDER' },
    { key: 'messages.manage.own', resource: 'messages', action: 'manage', scope: 'USER' },
    { key: 'notifications.manage.own', resource: 'notifications', action: 'manage', scope: 'USER' },
  ];

  const permissions = await prisma.permission.createMany({
    data: permissionMap,
    skipDuplicates: true,
  });

  return permissions;
}

async function ensureRoles() {
  const roles = [
    { name: 'Merchant', slug: 'merchant', description: 'Shop owner' },
    { name: 'Admin', slug: 'admin', description: 'Platform administrator' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { slug: role.slug },
      update: role,
      create: role,
    });
  }
}

async function ensureRolePermissions() {
  const permissionRecords = await prisma.permission.findMany();
  const rolePermissionMap: Record<string, string[]> = {
    merchant: ['users.read.self', 'users.write.self', 'shops.manage.own', 'products.manage.own', 'orders.manage.own', 'messages.manage.own', 'notifications.manage.own'],
    admin: ['users.read.self', 'users.write.self', 'users.read.all', 'users.write.all', 'shops.manage.own', 'shops.manage.all', 'products.manage.own', 'products.manage.all', 'orders.manage.own', 'messages.manage.own', 'notifications.manage.own'],
  };

  const roles = await prisma.role.findMany();
  for (const role of roles) {
    const keys = rolePermissionMap[role.slug] ?? [];
    const permissionIds = permissionRecords
      .filter((permission) => keys.includes(permission.key))
      .map((permission) => permission.id);

    for (const permissionId of permissionIds) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId,
          },
        },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }
}

async function buildUsers() {
  const passwordHash = await bcrypt.hash('MarketNet123!', 10);

  const demoUsers = [
    {
      email: 'merchant.demo@marketnet.test',
      fullName: 'Marchand Demo',
      phone: '+243970000002',
      passwordHash,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      role: 'merchant',
    },
    {
      email: 'admin.demo@marketnet.test',
      fullName: 'Admin Demo',
      phone: '+243970000003',
      passwordHash,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      role: 'admin',
    },
  ] as const;

  const createdUsers: Record<string, any> = {};

  for (const userData of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        fullName: userData.fullName,
        phone: userData.phone,
        passwordHash: userData.passwordHash,
        status: userData.status,
        isEmailVerified: userData.isEmailVerified,
      },
      create: {
        email: userData.email,
        fullName: userData.fullName,
        phone: userData.phone,
        passwordHash: userData.passwordHash,
        status: userData.status,
        isEmailVerified: userData.isEmailVerified,
      },
    });

    const role = await prisma.role.findUnique({ where: { slug: userData.role } });
    if (!role) {
      throw new Error(`Role ${userData.role} missing`);
    }

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });

    createdUsers[userData.role] = user;
  }

  return createdUsers;
}

async function buildCatalog(users: Record<string, any>) {
  const categories = await prisma.category.createMany({
    data: [
      { name: 'Électronique', slug: 'electronique', description: 'Produits électroniques', sortOrder: 1 },
      { name: 'Maison', slug: 'maison', description: 'Accessoires et décoration', sortOrder: 2 },
      { name: 'Mode', slug: 'mode', description: 'Vêtements et accessoires', sortOrder: 3 },
    ],
    skipDuplicates: true,
  });

  const categoryList = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });

  const merchant = users.merchant;

  const shop = await prisma.shop.upsert({
    where: { slug: 'boutique-demo' },
    update: {
      name: 'Boutique Demo',
      ownerId: merchant.id,
      slogan: 'Produits utiles pour le quotidien',
      description: 'Boutique de démonstration pour les parcours marketplace.',
      whatsapp: '+243970000002',
      city: 'Lubumbashi',
      country: 'DRC',
      status: ShopStatus.PUBLISHED,
    },
    create: {
      ownerId: merchant.id,
      slug: 'boutique-demo',
      name: 'Boutique Demo',
      slogan: 'Produits utiles pour le quotidien',
      description: 'Boutique de démonstration pour les parcours marketplace.',
      whatsapp: '+243970000002',
      city: 'Lubumbashi',
      country: 'DRC',
      status: ShopStatus.PUBLISHED,
    },
  });

  const draftShop = await prisma.shop.upsert({
    where: { slug: 'boutique-brouillon' },
    update: {
      name: 'Boutique Brouillon',
      ownerId: merchant.id,
      slogan: 'Non publié',
      status: ShopStatus.DRAFT,
    },
    create: {
      ownerId: merchant.id,
      slug: 'boutique-brouillon',
      name: 'Boutique Brouillon',
      slogan: 'Non publié',
      status: ShopStatus.DRAFT,
    },
  });

  const publishedProduct = await prisma.product.upsert({
    where: { shopId_slug: { shopId: shop.id, slug: 'ecouteur-bluetooth-demo' } },
    update: {
      name: 'Écouteur Bluetooth Demo',
      categoryId: categoryList[0]?.id ?? null,
      shortDescription: 'Écouteurs sans fil, parfaits pour le quotidien.',
      description: 'Écouteurs Bluetooth, qualité sonore correcte, boîtier de chargement inclus.',
      priceCents: 29000,
      compareAtPriceCents: 34000,
      stockQuantity: 15,
      status: ProductStatus.ACTIVE,
      isPublished: true,
      isFeatured: true,
    },
    create: {
      shopId: shop.id,
      categoryId: categoryList[0]?.id ?? null,
      name: 'Écouteur Bluetooth Demo',
      slug: 'ecouteur-bluetooth-demo',
      shortDescription: 'Écouteurs sans fil, parfaits pour le quotidien.',
      description: 'Écouteurs Bluetooth, qualité sonore correcte, boîtier de chargement inclus.',
      priceCents: 29000,
      compareAtPriceCents: 34000,
      stockQuantity: 15,
      status: ProductStatus.ACTIVE,
      isPublished: true,
      isFeatured: true,
    },
  });

  const hiddenProduct = await prisma.product.upsert({
    where: { shopId_slug: { shopId: shop.id, slug: 'lampe-ambiante-cachee' } },
    update: {
      name: 'Lampe Ambiante Cachée',
      categoryId: categoryList[1]?.id ?? null,
      shortDescription: 'Produit non publié pour tester les règles de visibilité.',
      description: 'Produit en attente de publication pour la validation du catalogue public.',
      priceCents: 18000,
      stockQuantity: 8,
      status: ProductStatus.DRAFT,
      isPublished: false,
      isFeatured: false,
    },
    create: {
      shopId: shop.id,
      categoryId: categoryList[1]?.id ?? null,
      name: 'Lampe Ambiante Cachée',
      slug: 'lampe-ambiante-cachee',
      shortDescription: 'Produit non publié pour tester les règles de visibilité.',
      description: 'Produit en attente de publication pour la validation du catalogue public.',
      priceCents: 18000,
      stockQuantity: 8,
      status: ProductStatus.DRAFT,
      isPublished: false,
      isFeatured: false,
    },
  });

  const outOfStockProduct = await prisma.product.upsert({
    where: { shopId_slug: { shopId: shop.id, slug: 'sac-a-main-sans-stock' } },
    update: {
      name: 'Sac à Main Sans Stock',
      categoryId: categoryList[2]?.id ?? null,
      shortDescription: 'Produit hors stock pour valider l’interdiction de commande.',
      description: 'Produit de démonstration pour les cas de rupture de stock.',
      priceCents: 42000,
      stockQuantity: 0,
      status: ProductStatus.OUT_OF_STOCK,
      isPublished: true,
      isFeatured: false,
    },
    create: {
      shopId: shop.id,
      categoryId: categoryList[2]?.id ?? null,
      name: 'Sac à Main Sans Stock',
      slug: 'sac-a-main-sans-stock',
      shortDescription: 'Produit hors stock pour valider l’interdiction de commande.',
      description: 'Produit de démonstration pour les cas de rupture de stock.',
      priceCents: 42000,
      stockQuantity: 0,
      status: ProductStatus.OUT_OF_STOCK,
      isPublished: true,
      isFeatured: false,
    },
  });

  await prisma.productImage.upsert({
    where: {
      id: 'img-demo-headphones',
    },
    update: {
      productId: publishedProduct.id,
      url: 'https://images.example.com/headphones.jpg',
      altText: 'Écouteur Bluetooth demo',
      isPrimary: true,
      sortOrder: 1,
    },
    create: {
      id: 'img-demo-headphones',
      productId: publishedProduct.id,
      url: 'https://images.example.com/headphones.jpg',
      altText: 'Écouteur Bluetooth demo',
      isPrimary: true,
      sortOrder: 1,
    },
  });

  await prisma.productVariant.upsert({
    where: {
      id: 'variant-demo-headphones',
    },
    update: {
      productId: publishedProduct.id,
      name: 'Couleur',
      value: 'Noir',
      sku: 'BT-001-BLK',
      priceCents: 29000,
      stockQuantity: 15,
      isActive: true,
    },
    create: {
      id: 'variant-demo-headphones',
      productId: publishedProduct.id,
      name: 'Couleur',
      value: 'Noir',
      sku: 'BT-001-BLK',
      priceCents: 29000,
      stockQuantity: 15,
      isActive: true,
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      id: 'spec-demo-headphones',
    },
    update: {
      productId: publishedProduct.id,
      name: 'Autonomie',
      value: '8h en écoute continue',
    },
    create: {
      id: 'spec-demo-headphones',
      productId: publishedProduct.id,
      name: 'Autonomie',
      value: '8h en écoute continue',
    },
  });

  return { shop, draftShop, publishedProduct, hiddenProduct, outOfStockProduct, categoryList };
}

async function buildOrderAndMessaging(users: Record<string, any>, shop: any, product: any) {
  const merchant = users.merchant;
  const admin = users.admin;

  const order = await prisma.order.upsert({
    where: { id: 'order-demo-001' },
    update: {
      userId: null,
      shopId: shop.id,
      status: OrderStatus.PROCESSING,
      subtotalCents: 58000,
      shippingCents: 2500,
      discountCents: 0,
      totalCents: 60500,
      customerName: 'Client invité',
      customerEmail: null,
      customerPhone: '+243970000001',
      deliveryAddress: 'Avenue de la Paix 12',
      deliveryCity: 'Lubumbashi',
      deliveryCountry: 'DRC',
      notes: 'Commande de test pour validation du parcours MARKETNET.',
    },
    create: {
      id: 'order-demo-001',
      userId: null,
      shopId: shop.id,
      status: OrderStatus.PROCESSING,
      subtotalCents: 58000,
      shippingCents: 2500,
      discountCents: 0,
      totalCents: 60500,
      customerName: 'Client invité',
      customerEmail: null,
      customerPhone: '+243970000001',
      deliveryAddress: 'Avenue de la Paix 12',
      deliveryCity: 'Lubumbashi',
      deliveryCountry: 'DRC',
      notes: 'Commande de test pour validation du parcours MARKETNET.',
    },
  });

  await prisma.orderItem.upsert({
    where: { id: 'order-item-demo-001' },
    update: {
      orderId: order.id,
      productId: product.id,
      name: product.name,
      quantity: 2,
      unitPriceCents: 29000,
      totalPriceCents: 58000,
    },
    create: {
      id: 'order-item-demo-001',
      orderId: order.id,
      productId: product.id,
      name: product.name,
      quantity: 2,
      unitPriceCents: 29000,
      totalPriceCents: 58000,
    },
  });

  const message = await prisma.message.upsert({
    where: { id: 'message-demo-001' },
    update: {
      shopId: shop.id,
      orderId: order.id,
      senderId: admin.id,
      receiverId: merchant.id,
      subject: 'Commande de test',
      content: 'Message de contrôle interne lié à la commande invitée de démonstration.',
      status: 'READ',
      isRead: true,
    },
    create: {
      id: 'message-demo-001',
      shopId: shop.id,
      orderId: order.id,
      senderId: admin.id,
      receiverId: merchant.id,
      subject: 'Commande de test',
      content: 'Message de contrôle interne lié à la commande invitée de démonstration.',
      status: 'READ',
      isRead: true,
    },
  });

  const notificationMerchant = await prisma.notification.upsert({
    where: { id: 'notification-demo-merchant' },
    update: {
      userId: merchant.id,
      type: NotificationType.MESSAGE,
      title: 'Nouveau message',
      message: 'Vous avez reçu un message concernant une commande de test.',
      isRead: false,
      relatedEntityType: 'message',
      relatedEntityId: message.id,
    },
    create: {
      id: 'notification-demo-merchant',
      userId: merchant.id,
      type: NotificationType.MESSAGE,
      title: 'Nouveau message',
      message: 'Vous avez reçu un message concernant une commande de test.',
      isRead: false,
      relatedEntityType: 'message',
      relatedEntityId: message.id,
    },
  });

  await prisma.analyticsEvent.createMany({
    data: [
      {
        userId: null,
        shopId: shop.id,
        productId: product.id,
        eventType: AnalyticsEventType.PRODUCT_VIEW,
        sessionId: 'seed-session-1',
        metadata: { source: 'seed', path: '/products/' + product.id },
      },
      {
        userId: null,
        shopId: shop.id,
        productId: product.id,
        eventType: AnalyticsEventType.ORDER_CREATED,
        sessionId: 'seed-session-1',
        metadata: { orderId: order.id, amountCents: order.totalCents },
      },
    ],
  });

  return { order, message, notificationMerchant };
}

async function main() {
  console.log('🚀 Seeding local MARKETNET test data...');
  await resetDatabase();
  await ensurePermissions();
  await ensureRoles();
  await ensureRolePermissions();

  const users = await buildUsers();
  const { shop, publishedProduct } = await buildCatalog(users);
  await buildOrderAndMessaging(users, shop, publishedProduct);

  console.log('✅ Seed ready');
  console.log(JSON.stringify({
    users: Object.keys(users),
    shop: shop.slug,
    product: publishedProduct.slug,
    testPassword: 'MarketNet123!',
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('❌ Seed failed');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
