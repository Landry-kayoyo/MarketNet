export const JWT_ACCESS_TTL = '15m';
export const JWT_REFRESH_TTL = '30d';
export const DEFAULT_ROLE_SLUGS = ['merchant', 'admin'] as const;

export const DEFAULT_PERMISSIONS = {
  merchant: ['users.read.self', 'users.write.self', 'shops.manage.own', 'products.manage.own', 'orders.manage.own', 'messages.manage.own', 'notifications.manage.own'],
  admin: ['users.read.self', 'users.write.self', 'users.read.all', 'users.write.all', 'shops.manage.own', 'shops.manage.all', 'products.manage.own', 'products.manage.all', 'orders.manage.own', 'messages.manage.own', 'notifications.manage.own'],
} as const;

export type AuthRoleSlug = (typeof DEFAULT_ROLE_SLUGS)[number];
