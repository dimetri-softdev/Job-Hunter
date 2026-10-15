ALTER TABLE "FeedbackResponse"
ADD COLUMN "reviewed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "adminNotes" TEXT;

CREATE TABLE "AdminAccess" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAccess_pkey" PRIMARY KEY ("userId")
);

CREATE UNIQUE INDEX "AdminAccess_email_key" ON "AdminAccess"("email");
