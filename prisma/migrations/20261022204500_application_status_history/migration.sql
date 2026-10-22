CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isBaseline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApplicationStatusHistory_applicationId_changedAt_idx"
ON "ApplicationStatusHistory"("applicationId", "changedAt");

CREATE INDEX "ApplicationStatusHistory_userId_changedAt_idx"
ON "ApplicationStatusHistory"("userId", "changedAt");

ALTER TABLE "ApplicationStatusHistory"
ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApplicationStatusHistory"
ADD CONSTRAINT "ApplicationStatusHistory_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ApplicationStatusHistory" (
    "id", "applicationId", "userId", "fromStatus", "toStatus", "changedAt", "isBaseline"
)
SELECT
    'baseline-' || application."id",
    application."id",
    application."userId",
    NULL,
    application."status",
    CURRENT_TIMESTAMP,
    true
FROM "Application" application;

CREATE FUNCTION record_application_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "ApplicationStatusHistory" (
            "id", "applicationId", "userId", "fromStatus", "toStatus", "changedAt", "isBaseline"
        ) VALUES (
            gen_random_uuid()::text, NEW."id", NEW."userId", NULL, NEW."status", CURRENT_TIMESTAMP, false
        );
    ELSIF OLD."status" IS DISTINCT FROM NEW."status" THEN
        INSERT INTO "ApplicationStatusHistory" (
            "id", "applicationId", "userId", "fromStatus", "toStatus", "changedAt", "isBaseline"
        ) VALUES (
            gen_random_uuid()::text, NEW."id", NEW."userId", OLD."status", NEW."status", CURRENT_TIMESTAMP, false
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Application_status_history_after_write"
AFTER INSERT OR UPDATE ON "Application"
FOR EACH ROW
EXECUTE FUNCTION record_application_status_history();
