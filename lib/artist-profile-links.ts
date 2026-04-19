/**
 * Map ExternalLink rows ↔ profile edit form (registration-style URL fields).
 */

export type ProfileSocialForm = {
  linkedinUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  websiteUrls: { url: string }[];
};

export function profileSocialFromExternalLinks(
  rows: { linkType: string; url: string }[],
): ProfileSocialForm {
  const lower = (t: string) => t.trim().toLowerCase();
  const byType = new Map<string, string>();
  const websites: { url: string }[] = [];
  for (const r of rows) {
    const t = lower(r.linkType);
    if (t === "website") {
      if (r.url.trim()) websites.push({ url: r.url });
    } else {
      byType.set(t, r.url);
    }
  }
  return {
    linkedinUrl: byType.get("linkedin") ?? "",
    instagramUrl: byType.get("instagram") ?? "",
    facebookUrl: byType.get("facebook") ?? "",
    twitterUrl: byType.get("twitter") ?? "",
    youtubeUrl: byType.get("youtube") ?? "",
    websiteUrls: websites.length > 0 ? websites : [{ url: "" }],
  };
}

export function buildExternalLinkRows(
  artistId: string,
  input: ProfileSocialForm,
): { artistId: string; linkType: string; url: string }[] {
  const rows: { artistId: string; linkType: string; url: string }[] = [];
  const add = (linkType: string, url: string) => {
    const t = url.trim();
    if (!t) return;
    rows.push({ artistId, linkType, url: t });
  };
  add("linkedin", input.linkedinUrl);
  add("instagram", input.instagramUrl);
  add("facebook", input.facebookUrl);
  add("twitter", input.twitterUrl);
  add("youtube", input.youtubeUrl);
  for (const w of input.websiteUrls) {
    add("website", w.url ?? "");
  }
  return rows;
}
