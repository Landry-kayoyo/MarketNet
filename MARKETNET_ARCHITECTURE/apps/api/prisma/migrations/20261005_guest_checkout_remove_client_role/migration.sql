-- MARKETNET customers are guests, not authenticated users with a client role.
-- Existing orders are retained; their customer details remain on the order row.
ALTER TABLE "orders" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "shopId" DROP NOT NULL;

-- ON DELETE CASCADE removes only role assignments and permissions linked to this role.
DELETE FROM "roles" WHERE "slug" = 'client';
