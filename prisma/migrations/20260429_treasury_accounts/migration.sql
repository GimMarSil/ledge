-- Treasury accounts (contas de tesouraria) and Transaction reimbursement
-- linkage. Idempotent so it tolerates environments where a prior
-- `prisma db push` already applied parts of the change.

CREATE TABLE IF NOT EXISTS "treasury_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'company',
    "holder_name" TEXT,
    "iban" TEXT,
    "bank_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treasury_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "treasury_accounts_user_id_code_key" ON "treasury_accounts"("user_id", "code");
CREATE INDEX IF NOT EXISTS "treasury_accounts_user_id_idx" ON "treasury_accounts"("user_id");
CREATE INDEX IF NOT EXISTS "treasury_accounts_type_idx" ON "treasury_accounts"("type");

DO $$ BEGIN
  ALTER TABLE "treasury_accounts" ADD CONSTRAINT "treasury_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "treasury_account_code" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "reimbursement_status" TEXT DEFAULT 'pending';
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "reimbursement_paid_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "transactions_treasury_account_code_idx" ON "transactions"("treasury_account_code");
CREATE INDEX IF NOT EXISTS "transactions_reimbursement_status_idx" ON "transactions"("reimbursement_status");

DO $$ BEGIN
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_treasury_account_code_user_id_fkey"
    FOREIGN KEY ("treasury_account_code", "user_id")
    REFERENCES "treasury_accounts"("code", "user_id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
