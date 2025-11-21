-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "account" TEXT,
    "amount" TEXT,
    "balance" TEXT,
    "description" TEXT,
    "time" TIMESTAMP(3),
    "rawText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_messageId_key" ON "Transaction"("messageId");
