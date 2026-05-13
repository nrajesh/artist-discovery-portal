CREATE TABLE "ProfilePhotoReport" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "ProfilePhotoReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProfilePhotoReport_artistId_resolvedAt_createdAt_idx"
ON "ProfilePhotoReport"("artistId", "resolvedAt", "createdAt");

CREATE INDEX "ProfilePhotoReport_reporterId_createdAt_idx"
ON "ProfilePhotoReport"("reporterId", "createdAt");

CREATE INDEX "ProfilePhotoReport_resolvedBy_idx"
ON "ProfilePhotoReport"("resolvedBy");

ALTER TABLE "ProfilePhotoReport"
ADD CONSTRAINT "ProfilePhotoReport_artistId_fkey"
FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfilePhotoReport"
ADD CONSTRAINT "ProfilePhotoReport_reporterId_fkey"
FOREIGN KEY ("reporterId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfilePhotoReport"
ADD CONSTRAINT "ProfilePhotoReport_resolvedBy_fkey"
FOREIGN KEY ("resolvedBy") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
