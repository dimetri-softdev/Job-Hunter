ALTER TABLE "UserSubscription"
ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cancellationRequestedAt" TIMESTAMP(3),
ADD COLUMN "cancellationRequestSentAt" TIMESTAMP(3),
ADD COLUMN "cancellationAttemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "cancellationLastAttemptAt" TIMESTAMP(3);

ALTER TABLE "PayfastNotification"
ALTER COLUMN "amount" DROP NOT NULL;

CREATE INDEX "UserSubscription_cancelAtPeriodEnd_currentPeriodEnd_idx"
ON "UserSubscription"("cancelAtPeriodEnd", "currentPeriodEnd");
