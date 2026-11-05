import { test, expect } from "@playwright/test";
async function add(
  page: import("@playwright/test").Page,
  title: string,
  due?: string,
) {
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page.getByLabel("Task", { exact: true }).fill(title);
  if (due) await page.getByLabel("Due date").fill(due);
  await page.getByRole("combobox", { name: "Priority", exact: true }).selectOption("high");
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
}
test("task CRUD, priorities, completion and reload persistence", async ({
  page,
}) => {
  await page.goto("/");
  await add(page, "Book dentist");
  const task = page.locator("article").filter({ hasText: "Book dentist" });
  await expect(task).toContainText("high priority");
  await task
    .getByRole("button", { name: "Book dentist high priority" })
    .click();
  await page.getByLabel("Task", { exact: true }).fill("Book annual checkup");
  await page.getByLabel("Notes").fill("Bring insurance card");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page
    .getByRole("button", { name: "Complete Book annual checkup", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Reopen Book annual checkup",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "To do", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(0);
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await expect(page.locator("article")).toContainText("Bring insurance card");
  await page.locator("article .task-detail").click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.reload();
  await expect(page.locator("article")).toHaveCount(0);
});
test("calendar navigates leap month and groups due dates", async ({ page }) => {
  await page.goto("/");
  await add(page, "Leap day", "2028-02-29");
  await page.getByRole("button", { name: /All tasks/ }).click();
  await expect(page.locator("article")).toContainText("February 29");
  await page
    .getByRole("button", { name: "Calendar", exact: false })
    .first()
    .click();
  const target = new Date(2028, 1, 1),
    now = new Date();
  const delta =
    (target.getFullYear() - now.getFullYear()) * 12 +
    target.getMonth() -
    now.getMonth();
  for (let i = 0; i < Math.abs(delta); i++)
    await page
      .getByRole("button", {
        name: delta > 0 ? "Next month" : "Previous month",
      })
      .click();
  await page
    .getByRole("button", { name: "Tuesday, February 29, 1 tasks", exact: true })
    .click();
  await expect(page.locator("article")).toContainText("Leap day");
  await expect(page.locator(".calendar .day")).toHaveCount(35);
});
test("installed service worker launches offline and allows persistent edits", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await add(page, "Available offline");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => resolve(),
          { once: true },
        ),
      );
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("article")).toContainText("Available offline");
  await expect(page.getByText("Offline · ready to use")).toBeVisible();
  await add(page, "Created offline");
  await page.reload();
  await expect(page.locator("article")).toHaveCount(2);
  await expect(
    page.locator("article").filter({ hasText: "Created offline" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Install on iPhone" }).click();
  await expect(page.getByText(/open this site in Safari/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
