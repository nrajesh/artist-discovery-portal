import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockState = vi.hoisted(() => ({
  createdArgs: null as { data: Record<string, unknown> } | null,
  notifyShouldThrow: false,
  notifyCalls: [] as Array<Record<string, unknown>>,
}));

vi.mock("../db", () => {
  const mockClient = {
    artist: {
      findFirst: vi.fn(async () => null),
    },
    registrationRequest: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        mockState.createdArgs = args;
        return { id: args.data.id, ...args.data };
      }),
    },
  };

  return { getDb: () => mockClient };
});

vi.mock("../pii-crypto", () => ({
  encryptPiiField: vi.fn((value: string) => `enc:${value}`),
  emailLookupHash: vi.fn((value: string) => `hash:${value}`),
  isPiiCryptoConfigured: vi.fn(() => true),
  normalizeEmailForLookup: vi.fn((value: string) => value.trim().toLowerCase()),
}));

vi.mock("../notifications", () => ({
  notifyAdminRegistrationEvent: vi.fn(async (input: Record<string, unknown>) => {
    mockState.notifyCalls.push(input);
    if (mockState.notifyShouldThrow) {
      throw new Error("notification failed");
    }
  }),
}));

vi.mock("../profile-photo-storage", () => ({
  deleteManagedFileByUrlBestEffort: vi.fn(async () => undefined),
  deleteManagedProfilePhotoBestEffort: vi.fn(async () => undefined),
  isUploadedProfilePhotoFile: vi.fn(() => false),
  uploadRegistrationBackgroundImage: vi.fn(),
  uploadRegistrationProfilePhoto: vi.fn(),
  uploadRegistrationProfilePhotoFromUrl: vi.fn(),
}));

vi.mock("../safe-log", () => ({
  logSafeError: vi.fn(),
}));

import { POST } from "@/app/api/registrations/route";

describe("POST /api/registrations", () => {
  beforeEach(() => {
    mockState.createdArgs = null;
    mockState.notifyShouldThrow = false;
    mockState.notifyCalls = [];
  });

  it("still returns success when admin notification fails after the registration is saved", async () => {
    mockState.notifyShouldThrow = true;

    const form = new FormData();
    form.set("fullName", "Test Artist");
    form.set("email", "artist@example.com");
    form.set("province", "Haarlem");
    form.set("contactNumber", "+31612345678");
    form.set("contactType", "whatsapp");
    form.append("specialities", "Vocal");
    form.set("twitterUrl", "testartist");

    const req = new NextRequest("http://localhost:3000/api/registrations", {
      method: "POST",
      body: form,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(mockState.createdArgs?.data.fullName).toBe("Test Artist");
    expect(mockState.notifyCalls).toHaveLength(1);
  });
});
