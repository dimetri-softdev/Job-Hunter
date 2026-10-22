ALTER TABLE "Application"
ADD COLUMN "contactName" TEXT,
ADD COLUMN "contactEmail" TEXT;

CREATE TABLE "ApplicationActivity" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApplicationActivity_applicationId_createdAt_idx"
ON "ApplicationActivity"("applicationId", "createdAt");

CREATE INDEX "ApplicationActivity_userId_createdAt_idx"
ON "ApplicationActivity"("userId", "createdAt");

ALTER TABLE "ApplicationActivity"
ADD CONSTRAINT "ApplicationActivity_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApplicationActivity"
ADD CONSTRAINT "ApplicationActivity_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ApplicationActivity" ("id", "applicationId", "userId", "kind", "detail", "createdAt")
SELECT
    'legacy-' || application."id",
    application."id",
    application."userId",
    'APPLICATION_SAVED',
    'Application added to your tracker with status ' ||
        INITCAP(REPLACE(application."status", '_', ' ')) || '.',
    application."createdAt"
FROM "Application" application;
