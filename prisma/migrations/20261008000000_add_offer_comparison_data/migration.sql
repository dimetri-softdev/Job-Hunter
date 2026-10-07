ALTER TABLE "User"
ADD COLUMN "offerPriorities" JSONB;

ALTER TABLE "Application"
ADD COLUMN "offerDetails" JSONB;
