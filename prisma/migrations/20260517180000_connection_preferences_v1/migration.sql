ALTER TABLE "NotificationPreference"
ADD COLUMN "connectionRequestsAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "connectionRequestEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "connectionApprovedEnabled" BOOLEAN NOT NULL DEFAULT true;
