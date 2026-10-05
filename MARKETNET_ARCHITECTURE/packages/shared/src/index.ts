export const MARKETNET_MODULES = [
  'auth',
  'shops',
  'products',
  'orders',
  'messages',
  'reviews',
  'analytics',
  'admin',
] as const;

export type MarketnetModule = (typeof MARKETNET_MODULES)[number];
