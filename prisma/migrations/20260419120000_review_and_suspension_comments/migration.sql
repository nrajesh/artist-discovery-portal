-- Admin review note on registration (reject: required from admin; approve: defaults to "Approved" when empty)
ALTER TABLE "RegistrationRequest" ADD COLUMN IF NOT EXISTS "reviewComment" TEXT;

-- Reason shown when an artist account is suspended (required when suspending)
ALTER TABLE "Artist" ADD COLUMN IF NOT EXISTS "suspensionComment" TEXT;
