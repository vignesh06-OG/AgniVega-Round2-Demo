import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:8081";

async function loginAs(page: any, role: "farmer" | "driver" | "fleet" | "admin") {
  await page.goto(`${BASE_URL}/auth`);
  await page.waitForLoadState("networkidle");
  const button = page.getByRole("button", { name: role.charAt(0).toUpperCase() + role.slice(1) });
  await button.click();
  await page.waitForLoadState("networkidle");
}

test.describe("Debug farmer flow", () => {
  test("Farmer dashboard - click new dispatch with wait", async ({ page }) => {
    await loginAs(page, "farmer");
    await page.waitForTimeout(2000);

    // Check for the new dispatch button with more specific selector
    const newDispatchBtn = page.locator(
      'button:has-text("New Dispatch"), button:has-text("नवीन बुकिंग"), a:has-text("New Dispatch"), a:has-text("नवीन बुकिंग")',
    );
    const count = await newDispatchBtn.count();
    console.log("New dispatch buttons found:", count);

    // Try to click the first one
    if (count > 0) {
      await newDispatchBtn.first().click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const bodyText = await page.locator("body").textContent();
      console.log("=== FARMER DRAFT STATE ===");
      console.log(bodyText);
    }
  });

  test("Farmer dashboard - check all buttons", async ({ page }) => {
    await loginAs(page, "farmer");
    await page.waitForTimeout(2000);

    const buttons = await page.locator("button").all();
    console.log("All buttons count:", buttons.length);
    for (let i = 0; i < Math.min(buttons.length, 20); i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}:`, text?.trim());
    }

    const links = await page.locator("a").all();
    console.log("All links count:", links.length);
    for (let i = 0; i < Math.min(links.length, 20); i++) {
      const text = await links[i].textContent();
      console.log(`Link ${i}:`, text?.trim());
    }
  });

  test("Farmer - check dashboard elements", async ({ page }) => {
    await loginAs(page, "farmer");
    await page.waitForTimeout(2000);

    // Check wallet
    const wallet = await page
      .getByText(/₹4,250/)
      .isVisible()
      .catch(() => false);
    console.log("Wallet visible:", wallet);

    // Check all text containing wallet
    const walletTexts = await page.getByText(/Wallet|वॉलेट|Balance|शिल्लक/).allTextContents();
    console.log("Wallet-related texts:", walletTexts);

    // Check active bookings
    const bookingsTexts = await page.getByText(/Active|सक्रिय|Booking|बुकिंग/).allTextContents();
    console.log("Booking-related texts:", bookingsTexts);
  });
});
