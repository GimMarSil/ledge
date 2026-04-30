-- Soft-delete on transactions. Idempotent so re-runs are safe.

ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "transactions_deleted_at_idx" ON "transactions"("deleted_at");
