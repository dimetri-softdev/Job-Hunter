ALTER TABLE "Roadmap"
ADD COLUMN "applicationId" TEXT;

CREATE INDEX "Roadmap_applicationId_idx"
ON "Roadmap"("applicationId");

ALTER TABLE "Roadmap"
ADD CONSTRAINT "Roadmap_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
