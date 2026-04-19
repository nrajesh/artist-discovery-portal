-- CreateEnum
CREATE TYPE "PiiVisibility" AS ENUM ('PRIVATE', 'COLLABORATORS_ONLY', 'PUBLIC_PROFILE');

-- AlterTable Artist - add encrypted PII + visibility (legacy email/contact remain until backfilled)
ALTER TABLE "Artist"
  ADD COLUMN "emailCipher" TEXT,
  ADD COLUMN "emailLookupHash" TEXT,
  ADD COLUMN "contactCipher" TEXT,
  ADD COLUMN "emailVisibility" "PiiVisibility" NOT NULL DEFAULT 'PRIVATE',
  ADD COLUMN "contactVisibility" "PiiVisibility" NOT NULL DEFAULT 'COLLABORATORS_ONLY';

ALTER TABLE "Artist" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "Artist" ALTER COLUMN "contactNumber" DROP NOT NULL;

CREATE UNIQUE INDEX "Artist_emailLookupHash_key" ON "Artist"("emailLookupHash");

-- AlterTable RegistrationRequest
ALTER TABLE "RegistrationRequest"
  ADD COLUMN "emailCipher" TEXT,
  ADD COLUMN "emailLookupHash" TEXT,
  ADD COLUMN "contactCipher" TEXT;

ALTER TABLE "RegistrationRequest" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "RegistrationRequest" ALTER COLUMN "contactNumber" DROP NOT NULL;
