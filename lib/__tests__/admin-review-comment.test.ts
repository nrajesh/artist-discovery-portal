import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { parseAmendRegistrationReviewComment } from "../admin-review-comment";

describe("parseAmendRegistrationReviewComment", () => {
  it("treats whitespace-only form comment as null", async () => {
    const form = new FormData();
    form.set("comment", "   ");
    const req = new NextRequest("http://localhost/test", {
      method: "POST",
      body: form,
    });
    const r = await parseAmendRegistrationReviewComment(req);
    expect(r).toEqual({ ok: true, comment: null });
  });

  it("trims non-empty form comment", async () => {
    const form = new FormData();
    form.set("comment", "  reason  ");
    const req = new NextRequest("http://localhost/test", {
      method: "POST",
      body: form,
    });
    const r = await parseAmendRegistrationReviewComment(req);
    expect(r).toEqual({ ok: true, comment: "reason" });
  });

  it("parses JSON comment", async () => {
    const req = new NextRequest("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ comment: "ok" }),
    });
    const r = await parseAmendRegistrationReviewComment(req);
    expect(r).toEqual({ ok: true, comment: "ok" });
  });
});
