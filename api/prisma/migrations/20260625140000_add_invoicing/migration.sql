-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('pending', 'issued', 'failed');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "invoice_id" TEXT;

-- CreateTable
CREATE TABLE "pending_invoices" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "invoice_data" JSONB NOT NULL,
    "guest_email" TEXT,
    "guest_name" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'pending',
    "alegra_error" TEXT,
    "alegra_invoice_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_invoices_status_created_at_idx" ON "pending_invoices"("status", "created_at");

-- CreateIndex
CREATE INDEX "pending_invoices_booking_id_idx" ON "pending_invoices"("booking_id");

-- AddForeignKey
ALTER TABLE "pending_invoices" ADD CONSTRAINT "pending_invoices_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
