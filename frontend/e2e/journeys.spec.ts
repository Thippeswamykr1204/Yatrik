import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { sampleTrip } from "../src/lib/sample-trip";

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("landing is accessible, responsive, and carries destination choices into planning", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Go somewhere",
  );
  await page.getByLabel("Where to?").fill("Jaipur, India");
  await page.getByLabel("For how long?").selectOption("7");
  await noOverflow(page);
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.getByRole("button", { name: "Make it happen" }).click();
  await expect(page.getByLabel("Your destination")).toHaveValue(
    "Jaipur, India",
  );
  await expect(page.getByLabel("Custom number of days")).toHaveValue("7");
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test("sample itinerary supports editing, packing, download, print, light theme, and keyboard dialogs", async ({
  page,
}) => {
  await page.goto("/itinerary/sample");
  await expect(page.getByText(/a hand-written sample/)).toBeVisible();
  await page
    .getByRole("button", { name: "Edit A slow morning in Fort Kochi" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByLabel("Activity", { exact: true })
    .fill("Coffee, then a quiet walk");
  await page.getByRole("button", { name: "Save this little change" }).click();
  await expect(
    page.getByRole("tabpanel").getByText("Coffee, then a quiet walk"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Day 2", exact: true }).click();
  await expect(
    page.getByRole("tabpanel").getByText("An afternoon on the backwaters"),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Pack a little smarter" }).click();
  await page.getByRole("checkbox", { name: /Reusable water bottle/ }).check();
  await expect(
    page.getByText("1 of 8 things, packed and ready."),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download plan" }).click();
  expect((await download).suggestedFilename()).toContain("yatrik-");
  expect(
    await page
      .locator("html")
      .evaluate((element) => getComputedStyle(element).colorScheme),
  ).toBe("light");
  await noOverflow(page);
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-days")).toBeVisible();
  await expect(
    page.locator(".print-days").getByText("The last cup of chai"),
  ).toBeVisible();
});

test("guest choices survive signup and generate a private itinerary (API boundary stubbed)", async ({
  page,
}) => {
  const id = "507f1f77bcf86cd799439011";
  let created = false;
  let generated = false;
  let getCount = 0;
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, json: { success: true, data } });
    if (path === "/api/auth/register")
      return json({
        user: { id: "user-1", name: "Asha", email: "asha@example.com" },
        accessToken: "test-access-token",
      });
    if (path === "/api/trips" && method === "POST") {
      expect(route.request().postDataJSON()).toMatchObject({
        destination: "Kerala, India",
        durationDays: 3,
        budgetTier: "Medium",
        interests: ["Nature"],
      });
      created = true;
      return json({
        ...sampleTrip,
        _id: id,
        itinerary: [],
        generationStatus: "idle",
      });
    }
    if (path === `/api/trips/${id}/generate`) {
      generated = true;
      return json({ jobId: "test-generation" }, 202);
    }
    if (path === `/api/trips/${id}`) {
      getCount++;
      return json({
        ...sampleTrip,
        _id: id,
        generationStatus: getCount < 2 ? "generating" : "completed",
        itinerary: getCount < 2 ? [] : sampleTrip.itinerary,
      });
    }
    return route.fulfill({
      status: 500,
      json: { message: `Unexpected test endpoint: ${path}` },
    });
  });
  await page.goto("/plan?destination=Kerala%2C%20India&days=3");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: /A little of both/ }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Into the wild" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Save my choices & continue" })
    .click();
  await page.getByLabel("Your name").fill("Asha");
  await page.getByLabel("Email address").fill("asha@example.com");
  await page.getByLabel("Password", { exact: true }).fill("TravelPass123!");
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(
    page.getByRole("heading", { name: "Looking like your kind of trip." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create my itinerary" }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/trip/${id}`));
  await expect(page.getByRole("tab", { name: "The itinerary" })).toBeVisible();
  expect(created).toBe(true);
  expect(generated).toBe(true);
  expect(
    await page.evaluate(() => Object.values(localStorage).join()),
  ).not.toContain("test-access-token");
  await noOverflow(page);
});

test("planner errors are announced, and light-theme forms meet accessibility checks", async ({
  page,
}) => {
  await page.goto("/plan");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("#planner-error")).toContainText("Tell us where");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.goto("/auth/login");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await noOverflow(page);
});
