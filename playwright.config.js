import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PORTFOLIO_TEST_URL || "http://127.0.0.1:8000",
    browserName: "chromium",
    launchOptions:
      process.platform === "win32"
        ? {
            executablePath:
              "C:/Program Files/Google/Chrome/Application/chrome.exe",
          }
        : {},
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: process.env.PORTFOLIO_TEST_URL
    ? undefined
    : {
        command: "npm run preview",
        url: "http://127.0.0.1:8000",
        reuseExistingServer: true,
        timeout: 15000,
      },
});
