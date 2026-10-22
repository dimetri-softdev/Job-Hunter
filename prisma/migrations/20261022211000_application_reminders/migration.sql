CREATE TABLE "UserReminderPreference" (
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReminderPreference_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "ApplicationReminderDelivery" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "followUpAt" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "ApplicationReminderDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApplicationReminderDelivery_applicationId_followUpAt_key"
ON "ApplicationReminderDelivery"("applicationId", "followUpAt");

CREATE INDEX "ApplicationReminderDelivery_userId_attemptedAt_idx"
ON "ApplicationReminderDelivery"("userId", "attemptedAt");

ALTER TABLE "UserReminderPreference"
ADD CONSTRAINT "UserReminderPreference_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApplicationReminderDelivery"
ADD CONSTRAINT "ApplicationReminderDelivery_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApplicationReminderDelivery"
ADD CONSTRAINT "ApplicationReminderDelivery_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
