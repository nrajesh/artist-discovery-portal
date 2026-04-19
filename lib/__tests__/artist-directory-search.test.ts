import { describe, expect, it } from "vitest";
import {
  artistMatchesDirectoryQuery,
  buildArtistKeywordHaystack,
  stripHtmlForSearch,
} from "@/lib/artist-directory-search";

describe("stripHtmlForSearch", () => {
  it("removes tags and collapses whitespace", () => {
    expect(stripHtmlForSearch("<p>Carnatic <strong>guitar</strong></p>")).toBe("Carnatic guitar");
  });
});

describe("buildArtistKeywordHaystack", () => {
  it("lowercases combined fields", () => {
    const h = buildArtistKeywordHaystack({
      name: "Ada",
      specialityNames: ["Violin"],
      bioPlain: "Amsterdam",
      linkUrls: ["https://instagram.com/AdaMusic"],
    });
    expect(h).toContain("ada");
    expect(h).toContain("instagram.com/adamusic");
  });
});

describe("artistMatchesDirectoryQuery", () => {
  const haystack = "jane doe violin carnatic guitar https://youtube.com/@janestudio";

  it("matches when all tokens appear in any order", () => {
    expect(artistMatchesDirectoryQuery(haystack, "carnatic guitar")).toBe(true);
    expect(artistMatchesDirectoryQuery(haystack, "guitar carnatic")).toBe(true);
  });

  it("returns true for blank query", () => {
    expect(artistMatchesDirectoryQuery(haystack, "   ")).toBe(true);
  });

  it("fails when a token is missing", () => {
    expect(artistMatchesDirectoryQuery(haystack, "carnatic veena")).toBe(false);
  });

  it("matches social path segments", () => {
    expect(artistMatchesDirectoryQuery(haystack, "janestudio")).toBe(true);
  });
});
