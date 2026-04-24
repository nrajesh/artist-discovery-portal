-- Phone is optional: contact type is only meaningful when a number exists.
ALTER TABLE "Artist" ALTER COLUMN "contactType" DROP NOT NULL;
ALTER TABLE "RegistrationRequest" ALTER COLUMN "contactType" DROP NOT NULL;
