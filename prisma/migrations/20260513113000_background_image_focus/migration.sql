-- Persist editable hero focus settings for artist background images.
ALTER TABLE "Artist"
ADD COLUMN "backgroundImageFocusX" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "backgroundImageFocusY" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "backgroundImageZoom" INTEGER NOT NULL DEFAULT 100;
