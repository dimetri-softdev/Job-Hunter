CREATE TABLE "UserFeatureGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFeatureGrant_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserFeatureGrant_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "UserFeatureGrant_userId_feature_expiresAt_idx"
    ON "UserFeatureGrant"("userId", "feature", "expiresAt");
