-- Add ControlHub linkage columns to users.
-- Idempotent: prior `prisma db push` runs may already have added them.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "external_id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "external_tenant_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_external_id_key" ON "users"("external_id");
