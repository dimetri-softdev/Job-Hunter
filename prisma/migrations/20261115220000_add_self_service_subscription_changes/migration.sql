ALTER TABLE "UserSubscription"
ADD COLUMN "scheduledPlan" TEXT,
ADD COLUMN "scheduledBillingInterval" TEXT;

ALTER TABLE "PayfastCheckout"
ADD COLUMN "changeType" TEXT NOT NULL DEFAULT 'NEW',
ADD COLUMN "replacedSubscriptionToken" TEXT,
ADD COLUMN "replacedSubscriptionPlan" TEXT,
ADD COLUMN "replacedSubscriptionBillingInterval" TEXT,
ADD COLUMN "replacedSubscriptionCancellationSentAt" TIMESTAMP(3),
ADD COLUMN "replacedSubscriptionCanceledAt" TIMESTAMP(3),
ADD COLUMN "replacedSubscriptionCancellationAttemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "replacedSubscriptionCancellationLastAttemptAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "PayfastCheckout_replacedSubscriptionToken_key"
ON "PayfastCheckout"("replacedSubscriptionToken");
