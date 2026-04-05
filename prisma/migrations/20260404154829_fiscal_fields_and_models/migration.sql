-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "atcud" TEXT,
ADD COLUMN     "customer_nif" TEXT,
ADD COLUMN     "document_number" TEXT,
ADD COLUMN     "document_series" TEXT,
ADD COLUMN     "document_type" TEXT,
ADD COLUMN     "fiscal_status" TEXT DEFAULT 'draft',
ADD COLUMN     "hash_control" TEXT,
ADD COLUMN     "nif" TEXT,
ADD COLUMN     "qr_code" TEXT,
ADD COLUMN     "subtotal" INTEGER,
ADD COLUMN     "vat_amount" INTEGER,
ADD COLUMN     "vat_breakdown" JSONB,
ADD COLUMN     "vat_rate" DECIMAL(65,30),
ADD COLUMN     "withholding_amount" INTEGER,
ADD COLUMN     "withholding_rate" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "business_activity" TEXT,
ADD COLUMN     "business_nif" TEXT,
ADD COLUMN     "business_tax_regime" TEXT,
ADD COLUMN     "tenant_id" TEXT;

-- CreateTable
CREATE TABLE "document_series" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "series" TEXT NOT NULL DEFAULT 'A',
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "at_validation_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_entities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "nif" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'PT',
    "email" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_tables" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tax_type" TEXT NOT NULL DEFAULT 'IVA',
    "region" TEXT NOT NULL DEFAULT 'PT',
    "tax_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_tables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_series_user_id_idx" ON "document_series"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_series_user_id_document_type_series_year_key" ON "document_series"("user_id", "document_type", "series", "year");

-- CreateIndex
CREATE INDEX "fiscal_entities_user_id_idx" ON "fiscal_entities"("user_id");

-- CreateIndex
CREATE INDEX "fiscal_entities_nif_idx" ON "fiscal_entities"("nif");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_entities_user_id_nif_type_key" ON "fiscal_entities"("user_id", "nif", "type");

-- CreateIndex
CREATE INDEX "tax_tables_user_id_idx" ON "tax_tables"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tax_tables_user_id_tax_type_region_tax_code_valid_from_key" ON "tax_tables"("user_id", "tax_type", "region", "tax_code", "valid_from");

-- CreateIndex
CREATE INDEX "transactions_document_type_idx" ON "transactions"("document_type");

-- CreateIndex
CREATE INDEX "transactions_document_number_idx" ON "transactions"("document_number");

-- CreateIndex
CREATE INDEX "transactions_nif_idx" ON "transactions"("nif");

-- CreateIndex
CREATE INDEX "transactions_fiscal_status_idx" ON "transactions"("fiscal_status");

-- AddForeignKey
ALTER TABLE "document_series" ADD CONSTRAINT "document_series_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_entities" ADD CONSTRAINT "fiscal_entities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_tables" ADD CONSTRAINT "tax_tables_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
