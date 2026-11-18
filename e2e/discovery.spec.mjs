import { test, expect } from "@playwright/test";
test("desktop match, navigation, reload, mobile drag and exhausted deck", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Maya, 24" })).toBeVisible();
  await expect(page.locator(".portrait img")).toHaveJSProperty(
    "complete",
    true,
  );
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await expect(page.locator("main")).toHaveCount(0);
  await page.getByRole("button", { name: "Discover", exact: true }).click();
  await page.getByRole("button", { name: "Like", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("It’s a match!");
  await page.getByRole("button", { name: "View matches" }).click();
  await expect(page.locator("li")).toContainText("Maya");
  await page.reload();
  await expect(page.locator("article")).toContainText("Theo");
  await page.setViewportSize({ width: 390, height: 844 });
  const box = await page.locator(".portrait").boundingBox();
  const x = box.x + box.width * 0.75,
    y = box.y + 50;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 140, y, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator("article")).toContainText("Aria");
  await page.getByRole("button", { name: "Pass", exact: true }).click();
  await expect(page.locator("article")).toContainText("Omar");
  const deck = await (await request.get("/feed")).json();
  for (const p of deck)
    await request.post("/swipe", {
      data: { profileId: p.id, decision: "pass" },
    });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "You’re all caught up." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View matches" }).click();
  await expect(page.locator("li")).toHaveCount(1);
});
