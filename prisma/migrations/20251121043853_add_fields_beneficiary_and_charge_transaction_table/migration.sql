-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "beneficiaryBankName" TEXT,
ADD COLUMN     "beneficiaryName" TEXT,
ADD COLUMN     "chargeAmount" TEXT,
ADD COLUMN     "chargeCode" TEXT;
