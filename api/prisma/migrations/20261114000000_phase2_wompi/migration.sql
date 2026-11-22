-- Phase 2 (Wompi-first payments): extend enums, add refunds, events, FX quotes

-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'wompi';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'cancelled';
ALTER TYPE "PaymentStatus" ADD VALUE 'partially_refunded';

-- CreateTable
CREATE TABLE "payment_refunds" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider_refund_id" TEXT,
    "original_amount_minor" INTEGER,
    "quote_rate" DECIMAL(14,6),
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT,
    "booking_id" TEXT,
    "quote_id" TEXT,
    "refund_id" TEXT,
    "correlation_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fx_quotes" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "charge_currency" TEXT NOT NULL DEFAULT 'COP',
    "charge_amount_minor" INTEGER NOT NULL,
    "display_currency" TEXT NOT NULL,
    "display_amount_minor" INTEGER NOT NULL,
    "rate" DECIMAL(14,6) NOT NULL,
    "rate_source" TEXT NOT NULL,
    "locked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "disclosure_version" TEXT,
    "disclosure_locale" TEXT,
    "disclosure_hash" TEXT,
    "disclosure_accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_refunds_payment_id_created_at_idx" ON "payment_refunds"("payment_id", "created_at");

-- CreateIndex
CREATE INDEX "payment_events_payment_id_created_at_idx" ON "payment_events"("payment_id", "created_at");

-- CreateIndex
CREATE INDEX "payment_events_booking_id_created_at_idx" ON "payment_events"("booking_id", "created_at");

-- CreateIndex
CREATE INDEX "payment_events_correlation_id_idx" ON "payment_events"("correlation_id");

-- CreateIndex
CREATE INDEX "fx_quotes_booking_id_created_at_idx" ON "fx_quotes"("booking_id", "created_at");

-- AddForeignKey
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
