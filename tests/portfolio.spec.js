import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const widths = [375, 390, 430, 768, 1024, 1440, 1920];

for (const width of widths) {
  test(`responsive layout and visual evidence at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("h1")).toContainText("model to");
    for (const id of [
      "top",
      "about",
      "experience",
      "skills",
      "dark-agent",
      "dark-agent-architecture",
      "dark-agent-screenshots",
      "smartinvest",
      "projects",
      "education",
      "contact",
    ]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      const overflow = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        return {
          page: document.documentElement.scrollWidth > width + 1,
          elements: [...document.querySelectorAll("main *")]
            .filter((el) => {
              const box = el.getBoundingClientRect();
              return (
                box.width &&
                (box.right > width + 2 || box.left < -2) &&
                getComputedStyle(el).position !== "absolute"
              );
            })
            .slice(0, 8)
            .map((el) => `${el.tagName}.${el.className}`),
        };
      });
      expect(overflow, `Overflow at ${id}`).toEqual({
        page: false,
        elements: [],
      });
      if (
        [
          "top",
          "about",
          "dark-agent",
          "dark-agent-architecture",
          "dark-agent-screenshots",
          "smartinvest",
          "projects",
          "contact",
        ].includes(id)
      ) {
        await page.screenshot({
          path: `.qa/screens/${width}-${id}.png`,
          animations: "disabled",
        });
      }
    }
    const broken = await page
      .locator("img[src]")
      .evaluateAll((images) =>
        images
          .filter(
            (image) =>
              image.checkVisibility() &&
              (!image.complete || image.naturalWidth === 0),
          )
          .map((image) => image.src),
      );
    expect(broken).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("theme destination and persistence, with an accessible first paint", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Switch to night theme" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Switch to night theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await expect(
    page.getByRole("button", { name: "Switch to ice theme" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await page.screenshot({ path: ".qa/screens/1440-night-arrival.png" });
  await page.getByRole("button", { name: "Switch to ice theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ice");
});

test("all tab interfaces support keyboard selection and expose connected panels", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const id of [
    "work-map",
    "capabilities",
    "agent-roles",
    "finance-pipeline",
    "project-index",
  ]) {
    const group = page.locator(`[data-tabs="${id}"]`);
    const tabs = group.getByRole("tab");
    await tabs.first().focus();
    await page.keyboard.press("End");
    await expect(tabs.last()).toBeFocused();
    await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
    await expect(group.getByRole("tabpanel")).toHaveCount(1);
    await page.keyboard.press("Home");
    await expect(tabs.first()).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    for (const tab of await tabs.all()) {
      await tab.click();
      await expect(group.getByRole("tabpanel")).toBeVisible();
    }
  }
});

test("mobile navigation, Escape, focus return, and anchor navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const button = page.getByRole("button", { name: "Open navigation index" });
  await button.click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(button).toBeFocused();
  await expect(page.getByRole("navigation")).not.toBeVisible();
  await button.click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "04 Dark Agent" })
    .click();
  await expect(page).toHaveURL(/#dark-agent$/);
  await expect(page.getByRole("navigation")).not.toBeVisible();
  await expect(page.locator("#dark-agent")).toBeFocused();
});

test("image dialog contains keyboard focus and restores the trigger on Escape", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const trigger = page.locator("#darkScreen");
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close image preview" }),
  ).toBeFocused();
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => document.activeElement.closest("dialog") !== null,
      ),
    ).toBeTruthy();
  }
  await expect(page.locator("#modalImage")).toHaveJSProperty("complete", true);
  expect(
    await page.locator("#modalImage").evaluate((img) => img.naturalWidth),
  ).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("screen storytelling and all original image evidence remain inspectable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const steps = page.locator("[data-screen-step]");
  await steps
    .last()
    .evaluate((element) => element.scrollIntoView({ block: "start" }));
  await expect(page.locator("#darkScreen")).toHaveAttribute(
    "data-preview",
    /dark-agent-07\.png/,
  );
  await steps.nth(4).click();
  await expect(page.locator("#darkScreen")).toHaveAttribute(
    "data-preview",
    /dark-agent-05\.png/,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await steps.nth(5).click();
  await expect(page.locator("#darkScreen")).toHaveAttribute(
    "data-preview",
    /dark-agent-07\.png/,
  );
  await page.locator(".screen-archive summary").click();
  const archive = page.locator(".screen-archive [data-preview]");
  await expect(archive).toHaveCount(13);
  for (const image of await archive.all()) {
    await image.click();
    await expect(page.locator("#modalImage")).toHaveJSProperty(
      "complete",
      true,
    );
    expect(
      await page.locator("#modalImage").evaluate((img) => img.naturalWidth),
    ).toBeGreaterThan(0);
    await page.keyboard.press("Escape");
  }
});

test("reduced motion, storage failure, and no JavaScript retain usable content", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Unavailable");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Unavailable");
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to night theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  expect(
    await page
      .locator("html")
      .evaluate((el) => getComputedStyle(el).scrollBehavior),
  ).toBe("auto");
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const nojs = await context.newPage();
  await nojs.goto("/");
  await expect(
    nojs.getByRole("heading", { name: "Don’t chat. Command." }),
  ).toBeVisible();
  await expect(nojs.locator("#project-index-panel-5")).toBeVisible();
  await context.close();
});

test("architecture progresses and the latest CV, email, and skip link work", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await page
    .locator('[data-architecture-step="8"]')
    .evaluate((element) => element.scrollIntoView({ block: "start" }));
  await expect(page.locator('[data-architecture-node="8"]')).toHaveAttribute(
    "aria-current",
    "step",
  );
  const pdfLinks = await page
    .locator('a[href$=".pdf"]')
    .evaluateAll((links) => [
      ...new Set(links.map((link) => link.getAttribute("href"))),
    ]);
  expect(pdfLinks).toEqual(["assets/MohamedBassam%20CV%20Improved%20.pdf"]);
  const pdf = await page.request.get(pdfLinks[0]);
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.locator("[data-copy]").click();
  await expect(page.locator("[data-copy]")).toHaveText("Email copied ✓");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "mobassam135@gmail.com",
  );
});

for (const theme of ["ice", "night"]) {
  test(`WCAG automated checks in ${theme} theme`, async ({ page }) => {
    await page.goto("/");
    if (theme === "night")
      await page.getByRole("button", { name: "Switch to night theme" }).click();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .options({ rules: { "label-content-name-mismatch": { enabled: true } } })
      .analyze();
    expect(
      results.violations.map(({ id, nodes }) => ({
        id,
        nodes: nodes.map((node) => ({
          target: node.target,
          summary: node.failureSummary,
        })),
      })),
    ).toEqual([]);
  });
}
