import { expect, test } from "@playwright/test";

type Status = "todo" | "doing" | "done";

type Card = {
  id: string;
  title: string | null;
  description: string;
  status: Status;
  created_at: string;
  updated_at: string;
};

let cards: Card[] = [];

test.beforeEach(async ({ page }) => {
  const now = new Date().toISOString();
  cards = [
    {
      id: "p-1",
      title: "Sprint kickoff",
      description: "Plan sprint goals",
      status: "todo",
      created_at: now,
      updated_at: now
    },
    {
      id: "p-2",
      title: "Connect API",
      description: "Wire up HTTP client",
      status: "doing",
      created_at: now,
      updated_at: now
    }
  ];

  await page.route("**/cards**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (method === "GET") {
      const status = url.searchParams.get("status") as Status | null;
      const filtered = status ? cards.filter((card) => card.status === status) : cards;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: filtered, total: filtered.length, page: 1, size: 100 })
      });
    }

    if (method === "POST") {
      const payload = JSON.parse(request.postData() ?? "{}");
      const created: Card = {
        id: `c-${Date.now()}`,
        title: payload.title ?? null,
        description: payload.description,
        status: payload.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      cards = [created, ...cards];
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(created)
      });
    }

    if (method === "PUT") {
      const segments = url.pathname.split("/");
      const id = segments[segments.length - 1];
      const payload = JSON.parse(request.postData() ?? "{}");
      cards = cards.map((card) =>
        card.id === id
          ? {
              ...card,
              title: payload.title ?? card.title,
              description: payload.description ?? card.description,
              status: payload.status ?? card.status,
              updated_at: new Date().toISOString()
            }
          : card
      );
      const updated = cards.find((card) => card.id === id);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(updated)
      });
    }

    if (method === "DELETE") {
      const segments = url.pathname.split("/");
      const id = segments[segments.length - 1];
      cards = cards.filter((card) => card.id !== id);
      return route.fulfill({ status: 204, body: "" });
    }

    return route.fallback();
  });

  await page.goto("/");
});

test("renders layout for each viewport", async ({ page }, testInfo) => {
  await expect(page.getByText("Sprint kickoff")).toBeVisible();
  if (testInfo.project.name === "mobile") {
    await expect(page.getByRole("tab", { name: "Todo" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Doing" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Done" })).toBeVisible();
  } else {
    await expect(page.getByTestId("column-todo")).toBeVisible();
    await expect(page.getByTestId("column-doing")).toBeVisible();
    await expect(page.getByTestId("column-done")).toBeVisible();
  }
});

test("creates, edits, and deletes a card", async ({ page }) => {
  await page.getByRole("button", { name: "New card" }).click();
  await page.getByLabel("Title").fill("Playwright task");
  await page.getByLabel("Description").fill("Add e2e cases");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Playwright task")).toBeVisible();

  const card = page.locator("[data-testid^='card-']").filter({ hasText: "Playwright task" }).first();
  await card.getByLabel("Card actions").click();
  await page.getByText("Edit").click();
  const descriptionField = page.getByLabel("Description");
  await descriptionField.fill("Add end-to-end coverage");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Add end-to-end coverage")).toBeVisible();

  await card.getByLabel("Card actions").click();
  await page.getByText("Delete").click();
  await expect(page.getByText("Playwright task")).toHaveCount(0);
});

test("moves a card between columns", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Drag and drop validated on desktop viewport");
  const card = page.locator("[data-testid^='card-']").filter({ hasText: "Sprint kickoff" }).first();
  const handle = card.getByLabel("Drag card");
  await handle.dragTo(page.getByTestId("column-doing"));
  await expect(page.getByTestId("column-doing").getByText("Sprint kickoff")).toBeVisible();
});
