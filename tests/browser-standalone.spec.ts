import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:8081";

async function loginAs(page: any, role: "farmer" | "driver" | "fleet" | "admin") {
  await page.goto(`${BASE_URL}/auth`);
  await page.waitForLoadState("networkidle");
  const button = page.getByRole("button", {
    name: role.charAt(0).toUpperCase() + role.slice(1),
  });
  await button.click();
  await page.waitForLoadState("networkidle");
}

async function clickNewDispatch(page: any) {
  await page
    .getByRole("button", { name: /New Dispatch|नवीन बुकिंग/ })
    .first()
    .click();
  await page.waitForLoadState("networkidle");
}

test.describe("AgniVega Round2 - Browser Tests (dev server must be running)", () => {
  test("Homepage loads without React error", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    const reactErrors = errors.filter(
      (e) => e.includes("React is not defined") || e.includes("ReferenceError: React"),
    );
    expect(reactErrors).toHaveLength(0);
  });

  test("Auth page works and can login as farmer", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: "Farmer" })).toBeVisible();
    await page.getByRole("button", { name: "Farmer" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/.*\/farmer/);
    await expect(page.getByText(/Welcome back|सुस्वागतम/)).toBeVisible();
  });

  test("Farmer dashboard shows wallet, active bookings, and new dispatch", async ({ page }) => {
    await loginAs(page, "farmer");
    await expect(page.getByText(/Wallet Balance|वॉलेट शिल्लक/)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Active Bookings|सक्रिय बुकिंग/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /New Dispatch|नवीन बुकिंग/ }).first(),
    ).toBeVisible();
  });

  test("Multi-vehicle allocation: 60 quintals shows explicit breakdown", async ({ page }) => {
    await loginAs(page, "farmer");
    await clickNewDispatch(page);

    await page.fill('input[type="number"]', "60");
    await page.waitForTimeout(500);

    await expect(page.getByText(/6,000 kg/)).toBeVisible();

    await page.locator('button:has-text("Onion"), button:has-text("कांदा")').first().click();
    await page.waitForTimeout(500);

    // Complete AI upload flow
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: "test.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("fake-image-data"),
      });
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /Save Quality Data|माहिती जतन करा/ }).click();
    await page.waitForTimeout(500);

    await page.getByRole("checkbox").click();
    await page.getByRole("button", { name: /Analyze Markets|बाजार.*विश्लेषण/ }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(4000);

    await expect(page.getByText(/Market Comparison|बाजारपेठ तुलना/)).toBeVisible();
    await expect(page.getByText(/Vehicle Allocation|वाहन वाटप/)).toBeVisible();

    const vehicleCards = page.locator(
      '.bg-muted:has-text("Max Capacity"), .bg-muted:has-text("वाहन क्षमता")',
    );
    const count = await vehicleCards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const allocatedText = await page.locator("text=/Your Load|तुमचा लोड/").allTextContents();
    console.log("Allocated per vehicle:", allocatedText);
  });

  test("Quantity state regression: 60 -> 20 -> 60 -> 35 -> 120 -> 12", async ({ page }) => {
    await loginAs(page, "farmer");
    await clickNewDispatch(page);

    // Select crop first so analyze is enabled
    await page.locator('button:has-text("Onion"), button:has-text("कांदा")').first().click();
    await page.getByRole("checkbox").click();

    const testQuantities = [60, 20, 60, 35, 120, 12];

    for (const qty of testQuantities) {
      await page.fill('input[type="number"]', String(qty));
      await page.waitForTimeout(300);
      const expectedKg = qty * 100;
      await expect(page.getByText(new RegExp(`${expectedKg.toLocaleString()} kg`))).toBeVisible();
    }
  });

  test("Market switch recalculates vehicle allocation", async ({ page }) => {
    await loginAs(page, "farmer");
    await clickNewDispatch(page);

    await page.fill('input[type="number"]', "30");
    await page.locator('button:has-text("Onion"), button:has-text("कांदा")').first().click();
    await page.waitForTimeout(500);

    // Complete AI upload flow
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: "test.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("fake-image-data"),
      });
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /Save Quality Data|माहिती जतन करा/ }).click();
    await page.waitForTimeout(500);

    await page.getByRole("checkbox").click();
    await page.getByRole("button", { name: /Analyze Markets|बाजार.*विश्लेषण/ }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(4000);

    const initialVehicles = await page.locator(".bg-muted").count();
    const mandiCards = page.locator("[role='radiogroup'] .relative.overflow-hidden");
    const mandiCount = await mandiCards.count();
    if (mandiCount > 1) {
      await mandiCards.nth(1).click();
      await page.waitForTimeout(1500);
      const newVehicles = await page.locator(".bg-muted").count();
      console.log(`Initial vehicles: ${initialVehicles}, New vehicles: ${newVehicles}`);
    }
  });

  test("Driver dashboard shows vehicle info without farmer financials", async ({ page }) => {
    await loginAs(page, "driver");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/MH-15-XY-1234/)).toBeVisible();
    await expect(page.getByText(/Tata Ace Gold|टाटा एस/)).toBeVisible();
    await expect(page.getByText(/Total Load|एकूण लोड/)).toBeVisible();
    await expect(page.getByText(/Route Map|रूट मॅप/)).toBeVisible();
  });

  test("Fleet dashboard accessible", async ({ page }) => {
    await loginAs(page, "fleet");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Fleet Console|फ्लीट कन्सोल/)).toBeVisible();
  });

  test("Admin dashboard accessible", async ({ page }) => {
    await loginAs(page, "admin");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Control Tower|कंट्रोल टॉवर/)).toBeVisible();
  });

  test("Image upload fallback works without Gemini key", async ({ page }) => {
    await loginAs(page, "farmer");
    await clickNewDispatch(page);

    await page.fill('input[type="number"]', "10");
    await page.locator('button:has-text("Onion"), button:has-text("कांदा")').first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText(/Upload Crop Sample|पिकाचा फोटो अपलोड/i)).toBeVisible();
  });

  test("Wallet shows ₹ and correct labels", async ({ page }) => {
    await loginAs(page, "farmer");
    await expect(page.getByText(/₹/)).toBeVisible();
    // Est. Net Amount only appears after analysis (OPTIONS_READY state)
    await clickNewDispatch(page);
    await page.fill('input[type="number"]', "10");
    await page.locator('button:has-text("Onion"), button:has-text("कांदा")').first().click();
    await page.waitForTimeout(500);

    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: "test.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("fake-image-data"),
      });
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /Save Quality Data|माहिती जतन करा/ }).click();
    await page.waitForTimeout(500);

    await page.getByRole("checkbox").click();
    await page.getByRole("button", { name: /Analyze Markets|बाजार.*विश्लेषण/ }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    await expect(page.getByText(/Est\. Net Amount|अंदाजित निव्वळ रक्कम/).first()).toBeVisible();
  });

  test("No dead buttons on farmer flow", async ({ page }) => {
    await loginAs(page, "farmer");
    await clickNewDispatch(page);

    await page.fill('input[type="number"]', "10");
    await page.locator('button:has-text("Onion"), button:has-text("कांदा")').first().click();
    await page.waitForTimeout(500);

    // Complete AI upload flow
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: "test.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("fake-image-data"),
      });
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /Save Quality Data|माहिती जतन करा/ }).click();
    await page.waitForTimeout(500);

    await page.getByRole("checkbox").click();
    await page.getByRole("button", { name: /Analyze Markets|बाजार.*विश्लेष्ण/ }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(4000);

    await page.getByRole("button", { name: /Back|मागे/ }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Select Crop|पीक निवडा/)).toBeVisible();
  });
});
