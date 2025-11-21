/*
  Warnings:

  - You are about to drop the column `account` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `balance` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "account",
DROP COLUMN "balance",
ADD COLUMN     "location" TEXT;
