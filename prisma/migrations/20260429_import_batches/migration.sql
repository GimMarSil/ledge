-- Import batches (track e-Fatura / CSV imports so they can be reviewed,
-- bulk-edited and rolled back as a unit). Idempotent so it tolerates
-- environments where a prior `prisma db push` already created parts.

CREATE TABLE IF NOT EXISTS "import_batches" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "filename" TEXT,
    "imported_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "import_batches_user_id_idx" ON "import_batches"("user_id");
CREATE INDEX IF NOT EXISTS "import_batches_source_idx" ON "import_batches"("source");

DO $$ BEGIN
  ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "import_batch_id" UUID;
CREATE INDEX IF NOT EXISTS "transactions_import_batch_id_idx" ON "transactions"("import_batch_id");

DO $$ BEGIN
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_import_batch_id_fkey"
    FOREIGN KEY ("import_batch_id")
    REFERENCES "import_batches"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
