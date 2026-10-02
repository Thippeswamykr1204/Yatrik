import { describe, expect, it, beforeEach } from "vitest";
import {
  DRAFT_KEY,
  destinationImage,
  formatMoney,
  initialDraft,
  readDraft,
  safeReturnPath,
  saveDraft,
  tripDraftSchema,
} from "@/lib/travel";

describe("trip planning boundaries", () => {
  beforeEach(() => sessionStorage.clear());
  it.each([0, -1, 31, 3.5, NaN, Infinity])(
    "rejects an invalid duration: %s",
    (durationDays) => {
      expect(
        tripDraftSchema.safeParse({
          ...initialDraft,
          destination: "Goa",
          durationDays,
        }).success,
      ).toBe(false);
    },
  );
  it.each([1, 5, 30])("accepts a whole-day trip of %s days", (durationDays) => {
    expect(
      tripDraftSchema.safeParse({
        ...initialDraft,
        destination: "Goa",
        durationDays,
      }).success,
    ).toBe(true);
  });
  it("trims destinations and rejects whitespace, oversize names, and invalid dates", () => {
    expect(
      tripDraftSchema.parse({ ...initialDraft, destination: "  Goa  " })
        .destination,
    ).toBe("Goa");
    for (const destination of [" ", "x".repeat(101)])
      expect(
        tripDraftSchema.safeParse({ ...initialDraft, destination }).success,
      ).toBe(false);
    for (const startDate of ["not-a-date", "2026-02-31", "2026-13-01"])
      expect(
        tripDraftSchema.safeParse({
          ...initialDraft,
          destination: "Goa",
          startDate,
        }).success,
      ).toBe(false);
  });
  it("restores a validated draft and safely ignores malformed storage", () => {
    const draft = {
      ...initialDraft,
      destination: "Kerala",
      interests: ["Food"],
    };
    saveDraft(draft);
    expect(readDraft()).toEqual(draft);
    sessionStorage.setItem(DRAFT_KEY, "{bad json");
    expect(readDraft()).toEqual(initialDraft);
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ destination: "Injected", durationDays: 900 }),
    );
    expect(readDraft()).toEqual(initialDraft);
  });
  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/auth/login",
    null,
  ])("rejects unsafe return path %s", (path) => {
    expect(safeReturnPath(path)).toBe("/dashboard");
  });
  it("retains a safe planning return path", () =>
    expect(safeReturnPath("/plan?review=1")).toBe("/plan?review=1"));
  it("formats INR and provides a fallback destination image", () => {
    expect(formatMoney(11600)).toBe("₹11,600");
    expect(destinationImage("Kochi, Kerala")).toContain("kerala");
    expect(destinationImage("Somewhere new")).toContain("mountains");
  });
});
