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
    await expect(page.locator("h1")).toContainText("real product.");
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
                !el.closest('[aria-hidden="true"]') &&
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
          path: `.qa/v4/test-${width}-${id}.png`,
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
    "capabilities",
    "agent-roles",
    "finance-pipeline",
    "project-index",
  ]) {
    if (id === "agent-roles")
      await page.locator(".case-note > summary").first().click();
    if (id === "finance-pipeline")
      await page.locator(".finance-explainer > summary").click();
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
  const button = page.getByRole("button", { name: "Open menu" });
  await button.click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(button).toBeFocused();
  await expect(page.getByRole("navigation")).not.toBeVisible();
  await button.click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Dark Agent" })
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
  await page.locator(".screen-story").evaluate((el) =>
    scrollTo({
      top: scrollY + el.getBoundingClientRect().bottom - innerHeight + 150,
      behavior: "instant",
    }),
  );
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

test("navigation stays calm through small scroll reversals and resize", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const header = page.locator(".site-header");
  const scroll = (top) =>
    page.evaluate(async (y) => {
      scrollTo({ top: y, behavior: "instant" });
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
    }, top);
  await scroll(600);
  await expect(header).toHaveClass(/is-descending/);
  await scroll(599);
  await expect(header).toHaveClass(/is-descending/);
  await page.setViewportSize({ width: 1439, height: 1000 });
  await expect(header).toHaveClass(/is-descending/);
  for (const y of [597, 594, 591, 586]) await scroll(y);
  await expect(header).not.toHaveClass(/is-descending/);
  await scroll(587);
  await expect(header).not.toHaveClass(/is-descending/);
  await scroll(610);
  await expect(header).toHaveClass(/is-descending/);
  await scroll(0);
  await expect(header).not.toHaveClass(/is-descending/);
});

test("screenshot selection keeps visible evidence consistent while loading and ignores stale responses", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let capture;
  const requested = new Promise((resolve) => {
    capture = resolve;
  });
  await page.route("**/assets/optimized/dark-agent-02.webp", (route) =>
    capture(route),
  );
  await page.goto("/");
  const steps = page.locator("[data-screen-step]");
  const screen = page.locator("#darkScreen");
  await steps.nth(1).click();
  const delayed = await requested;
  await expect(steps.first()).toHaveAttribute("aria-pressed", "true");
  await expect(screen).toHaveAttribute("data-preview", /dark-agent-01\.png/);
  await expect(page.locator("#darkScreenCount")).toHaveText("01 / 06");
  // A newer choice must win even when the older response arrives last.
  await steps.nth(2).click();
  await expect(screen).toHaveAttribute("data-preview", /dark-agent-10\.png/);
  await delayed.fulfill({ response: await delayed.fetch() });
  await page.waitForLoadState("networkidle");
  await expect(steps.nth(2)).toHaveAttribute("aria-pressed", "true");
  await expect(screen.locator("img:not(.motion-snapshot)")).toHaveAttribute(
    "src",
    /dark-agent-10\.webp/,
  );
  await expect(page.locator("#darkScreenCount")).toHaveText("03 / 06");
});

test("failed screenshot requests retain the current image and allow retry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/assets/optimized/dark-agent-02.webp", (route) =>
    route.abort(),
  );
  await page.goto("/");
  const steps = page.locator("[data-screen-step]");
  const screen = page.locator("#darkScreen");
  await steps.nth(1).click();
  await expect(page.locator("#announcement")).toContainText("could not load");
  await expect(steps.first()).toHaveAttribute("aria-pressed", "true");
  await expect(screen).toHaveAttribute("data-preview", /dark-agent-01\.png/);
  expect(
    await screen
      .locator("img")
      .evaluate((image) => image.complete && image.naturalWidth > 0),
  ).toBe(true);
  await page.unroute("**/assets/optimized/dark-agent-02.webp");
  await steps.nth(1).click();
  await expect(steps.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(screen).toHaveAttribute("data-preview", /dark-agent-02\.png/);
  await expect(page.locator("#darkScreenCaption")).toHaveText(
    await steps.nth(1).getAttribute("data-description"),
  );
  await screen.click();
  await expect(page.locator("#modalImage")).toHaveAttribute(
    "src",
    /dark-agent-02\.png/,
  );
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
  await nojs.setViewportSize({ width: 390, height: 844 });
  await expect(nojs.getByRole("navigation")).toBeVisible();
  await expect(nojs.locator("#architecture-detail-8")).toBeVisible();
  expect(
    await nojs.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
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
  await page.locator('[data-architecture-node="8"]').click();
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
    // Inspect every section at full opacity, including off-screen reveal content.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    if (theme === "night")
      await page.getByRole("button", { name: "Switch to night theme" }).click();
    await page
      .locator(".case-note, .finance-explainer")
      .evaluateAll((items) => items.forEach((el) => (el.open = true)));
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

test("hero responds subtly, has no dashboard controls, and links to real work", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#top [role=tab]")).toHaveCount(0);
  await expect(
    page.locator(".context-cursor, [data-cursor], .release-section"),
  ).toHaveCount(0);
  const art = page.locator("[data-depth]");
  const box = await art.boundingBox();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3);
  await expect
    .poll(() => art.evaluate((el) => el.style.getPropertyValue("--rotate-y")))
    .not.toBe("");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() => art.evaluate((el) => el.style.getPropertyValue("--rotate-y")))
    .toBe("0deg");
  await page
    .locator("#top")
    .getByRole("link", { name: "Explore Dark Agent" })
    .click();
  await expect(page).toHaveURL(/#dark-agent$/);
  await expect(page.locator(".site-header")).toHaveAttribute(
    "data-world",
    "dark",
  );
});

test("architecture supports direct inspection and keyboard traversal", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const redTeam = page.locator('[data-architecture-node="6"]');
  await redTeam.click();
  await expect(page.locator("#architecture-detail-6")).toBeVisible();
  await expect(page.locator("#architecture-detail-6")).toContainText(
    "Adversarial evaluation",
  );
  await page.keyboard.press("End");
  await expect(page.locator('[data-architecture-node="8"]')).toBeFocused();
  await expect(page.locator("#architecture-detail-8")).toContainText(
    "Database transactions",
  );
  await page.keyboard.press("Home");
  await expect(page.locator("#architecture-detail-0")).toBeVisible();
});

test("touch swipe changes the project without opening its image", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("/");
  const gallery = page.locator('[data-tabs="project-index"]');
  const image = gallery.getByRole("tabpanel").locator(".project-visual");
  await image.evaluate((el) =>
    scrollTo({
      top: scrollY + el.getBoundingClientRect().top - 160,
      behavior: "instant",
    }),
  );
  const box = await image.boundingBox();
  const session = await context.newCDPSession(page);
  const y = box.y + box.height / 2;
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 310, y }],
  });
  for (const x of [270, 220, 160, 100])
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y }],
    });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator("#project-index-tab-1")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await context.close();
});

test("motion interruptions preserve the selected project and native interaction", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#projects").scrollIntoViewIfNeeded();
  await page.locator("[data-reel-next]").evaluate((button) => {
    for (let i = 0; i < 9; i++) button.click();
  });
  await expect(page.locator("#project-index-panel-3")).toBeVisible();
  await expect(
    page.locator('.project-gallery [role="tabpanel"]:visible'),
  ).toHaveCount(1);
  expect(
    await page.locator(".project-gallery .motion-snapshot").count(),
  ).toBeLessThanOrEqual(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".motion-snapshot")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.playState === "running")
            .length,
      ),
    )
    .toBe(0);
  await expect(page.locator("#project-index-panel-3")).toBeVisible();
  await page.locator("#project-index-panel-3 .image-button").click();
  await expect(page.locator("#previewModal")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.locator("#project-index-panel-3 .image-button"),
  ).toBeFocused();
});

test("validation and pipeline motion keep evidence readable and respond to reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/");
  await page.locator('[data-architecture-node="6"]').click();
  await page.locator(".validation-inline").scrollIntoViewIfNeeded();
  await expect(page.locator("#architecture-detail-6")).toBeVisible();
  await expect(page.locator(".validation-inline")).toHaveClass(/is-validating/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const checks = await page
    .locator(".validation-inline li, .validation-inline .validation-result")
    .evaluateAll((items) => items.map((el) => getComputedStyle(el).opacity));
  expect(checks).toEqual(["1", "1", "1", "1", "1", "1"]);
  await page.locator('[data-architecture-node="6"]').press("End");
  await expect(page.locator('[data-architecture-node="8"]')).toBeFocused();
  await page.locator(".finance-explainer > summary").click();
  await page.locator("#finance-pipeline-tab-4").click();
  await expect(page.locator("#finance-pipeline-panel-4")).toBeVisible();
  await expect(page.locator('.finance-tabs [role="tab"].is-past')).toHaveCount(
    4,
  );
  await page.locator("#finance-pipeline-tab-4").press("ArrowRight");
  await expect(page.locator("#finance-pipeline-tab-5")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator("#finance-pipeline-panel-5")).toBeVisible();
});

test("deeper evidence remains available and reel controls work", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator(".case-note > summary").nth(2).click();
  await expect(page.locator(".redteam-section .validation-demo")).toContainText(
    "Illustrated workflow",
  );
  await expect(
    page.locator(".redteam-section .validation-demo li"),
  ).toHaveCount(5);
  await page.locator(".finance-explainer > summary").click();
  await page.getByRole("tab", { name: "Decision", exact: false }).click();
  await expect(page.locator("#finance-pipeline-panel-3")).toContainText(
    "confidence",
  );
  await page.getByRole("button", { name: "Next project", exact: true }).click();
  await expect(page.locator("#project-index-panel-1")).toBeVisible();
  await page
    .getByRole("button", { name: "Previous project", exact: true })
    .click();
  await expect(page.locator("#project-index-panel-0")).toBeVisible();
  await page
    .getByRole("button", { name: "Previous project", exact: true })
    .click();
  await expect(page.locator("#project-index-panel-5")).toBeVisible();
});
