ALTER TABLE "UserSubscription"
ADD COLUMN "providerEnvironment" TEXT;

UPDATE "UserSubscription"
SET "providerEnvironment" = 'sandbox'
WHERE "provider" = 'payfast';

ALTER TABLE "PayfastCheckout"
ADD COLUMN "providerEnvironment" TEXT NOT NULL DEFAULT 'sandbox';
