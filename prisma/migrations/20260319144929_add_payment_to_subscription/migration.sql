/*
  Warnings:

  - A unique constraint covering the columns `[paymentReceiptId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "paymentReceiptId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_paymentReceiptId_key" ON "public"."Subscription"("paymentReceiptId");

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_paymentReceiptId_fkey" FOREIGN KEY ("paymentReceiptId") REFERENCES "public"."PaymentReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
