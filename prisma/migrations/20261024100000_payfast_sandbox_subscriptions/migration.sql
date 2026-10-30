ALTER TABLE "UserSubscription"
ADD COLUMN "billingInterval" TEXT NOT NULL DEFAULT 'monthly';

CREATE TABLE "PayfastCheckout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "billingInterval" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "providerSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayfastCheckout_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PayfastCheckout_userId_createdAt_idx"
ON "PayfastCheckout"("userId", "createdAt");

CREATE TABLE "PayfastNotification" (
    "id" TEXT NOT NULL,
    "providerPaymentId" TEXT NOT NULL,
    "merchantReference" TEXT NOT NULL,
    "providerSubscriptionId" TEXT,
    "paymentStatus" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayfastNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayfastNotification_providerPaymentId_key"
ON "PayfastNotification"("providerPaymentId");

CREATE INDEX "PayfastNotification_merchantReference_idx"
ON "PayfastNotification"("merchantReference");

CREATE INDEX "PayfastNotification_providerSubscriptionId_idx"
ON "PayfastNotification"("providerSubscriptionId");
