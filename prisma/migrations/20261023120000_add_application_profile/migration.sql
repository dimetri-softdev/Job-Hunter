CREATE TABLE "ApplicationProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "linkedInUrl" TEXT,
    "githubUrl" TEXT,
    "portfolioUrl" TEXT,
    "noticePeriod" TEXT,
    "workAuthorization" TEXT,
    "salaryExpectation" TEXT,
    "eeoData" JSONB,
    "privacyConsentAccepted" BOOLEAN NOT NULL DEFAULT false,
    "workAuthorizationConsent" BOOLEAN NOT NULL DEFAULT false,
    "salaryExpectationConsent" BOOLEAN NOT NULL DEFAULT false,
    "eeoDataConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApplicationProfile_userId_key"
    ON "ApplicationProfile" ("userId");

CREATE INDEX "ApplicationProfile_userId_idx"
    ON "ApplicationProfile" ("userId");

ALTER TABLE "ApplicationProfile"
    ADD CONSTRAINT "ApplicationProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ApplicationProfileWorkHistoryEntry" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "company" TEXT,
    "title" TEXT,
    "location" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationProfileWorkHistoryEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApplicationProfileWorkHistoryEntry_profileId_idx"
    ON "ApplicationProfileWorkHistoryEntry" ("profileId");

ALTER TABLE "ApplicationProfileWorkHistoryEntry"
    ADD CONSTRAINT "ApplicationProfileWorkHistoryEntry_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "ApplicationProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ApplicationProfileEducationEntry" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "school" TEXT,
    "degree" TEXT,
    "fieldOfStudy" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "location" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationProfileEducationEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApplicationProfileEducationEntry_profileId_idx"
    ON "ApplicationProfileEducationEntry" ("profileId");

ALTER TABLE "ApplicationProfileEducationEntry"
    ADD CONSTRAINT "ApplicationProfileEducationEntry_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "ApplicationProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ApplicationProfileSkill" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "proficiency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationProfileSkill_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApplicationProfileSkill_profileId_idx"
    ON "ApplicationProfileSkill" ("profileId");

ALTER TABLE "ApplicationProfileSkill"
    ADD CONSTRAINT "ApplicationProfileSkill_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "ApplicationProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ApplicationProfileAnswer" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationProfileAnswer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApplicationProfileAnswer_profileId_questionKey_key"
    ON "ApplicationProfileAnswer" ("profileId", "questionKey");

CREATE INDEX "ApplicationProfileAnswer_profileId_idx"
    ON "ApplicationProfileAnswer" ("profileId");

ALTER TABLE "ApplicationProfileAnswer"
    ADD CONSTRAINT "ApplicationProfileAnswer_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "ApplicationProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
