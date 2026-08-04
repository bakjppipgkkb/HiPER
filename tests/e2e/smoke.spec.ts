import { expect, test } from "@playwright/test";

test("public home renders HiPER identity", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pengurusan kewangan");
  await expect(page.getByText("Hab Perbendaharaan Digital").first()).toBeVisible();
});

test("mobile navigation exposes administration entrance", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: /☰/ }).click();
  await expect(page.getByRole("link", { name: "Pentadbir" })).toBeVisible();
});
