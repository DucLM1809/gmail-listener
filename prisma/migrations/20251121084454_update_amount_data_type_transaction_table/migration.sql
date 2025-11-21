/*
  Warnings:

  - The `amount` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `chargeAmount` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "amount",
ADD COLUMN     "amount" DECIMAL(65,30),
DROP COLUMN "chargeAmount",
ADD COLUMN     "chargeAmount" DECIMAL(65,30);
