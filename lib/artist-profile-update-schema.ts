import { z } from "zod";
import {
  mergeFacebookUrl,
  mergeInstagramUrl,
  mergeLinkedinUrl,
  mergeTwitterUrl,
  mergeWebsitePath,
  mergeYoutubeUrl,
  isPlausibleContactNumber,
  sanitizeContactNumberInput,
} from "@/lib/registration-input-normalize";

const optionalHttpsPhotoUrlSchema = z.preprocess((val: unknown) => {
  if (val === undefined || val === null) return undefined;
  if (typeof val !== "string") return undefined;
  const t = val.trim();
  if (t === "") return undefined;
  return mergeWebsitePath(t);
}, z.union([z.undefined(), z.string().url("Must be a valid URL").refine((u) => /^https:\/\//i.test(u), "Must use HTTPS")]));

function optMergedSocialField(merge: (s: string) => string) {
  return z.preprocess(
    (val) => (typeof val === "string" ? merge(val.trim()) : ""),
    z.union([z.literal(""), z.string().url("Must be a valid URL")]),
  );
}

const websiteRowUrlSchema = z.preprocess(
  (val) => (typeof val === "string" ? mergeWebsitePath(val.trim()) : ""),
  z.union([z.literal(""), z.string().url("Must be a valid URL")]),
);

/** Shared validation for artist self-edit and admin edit of another artist. */
export const artistProfileEditSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(120),
  email: z.string().trim().toLowerCase().email("Valid email is required"),
  contactNumber: z.preprocess(
    (v) => (typeof v === "string" ? sanitizeContactNumberInput(v) : ""),
    z
      .string()
      .min(1, "Contact number is required")
      .refine(
        isPlausibleContactNumber,
        "Enter 7–15 digits; optional + only at the start (no spaces or other symbols)",
      ),
  ),
  contactType: z.enum(["whatsapp", "mobile"]),
  province: z.string().trim().min(1, "Province is required"),
  specialities: z
    .array(z.string().trim().min(1))
    .min(1, "At least one speciality is required")
    .max(3, "At most three specialities"),
  openToCollab: z.boolean(),
  profilePhotoUrl: optionalHttpsPhotoUrlSchema,
  backgroundImageUrl: optionalHttpsPhotoUrlSchema,
  bioRichText: z.string().max(200_000).optional(),
  websiteUrls: z.array(z.object({ url: websiteRowUrlSchema })).optional(),
  linkedinUrl: optMergedSocialField(mergeLinkedinUrl),
  instagramUrl: optMergedSocialField(mergeInstagramUrl),
  facebookUrl: optMergedSocialField(mergeFacebookUrl),
  twitterUrl: optMergedSocialField(mergeTwitterUrl),
  youtubeUrl: optMergedSocialField(mergeYoutubeUrl),
});

export type ArtistProfileEditInput = z.infer<typeof artistProfileEditSchema>;
