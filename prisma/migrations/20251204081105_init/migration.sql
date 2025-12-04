-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "description" TEXT,
    "time" TIMESTAMP(3),
    "location" TEXT,
    "rawText" TEXT,
    "beneficiaryName" TEXT,
    "beneficiaryBankName" TEXT,
    "chargeCode" TEXT,
    "chargeAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "picture" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "hashedRefreshToken" TEXT,
    "twoFactorSecret" TEXT,
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "role" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_messageId_key" ON "Transaction"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
