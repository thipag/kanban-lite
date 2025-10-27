import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/playwright",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:5173"
  },
  projects: [
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        hasTouch: true
      }
    },
    {
      name: "tablet",
      use: {
        viewport: { width: 768, height: 1024 }
      }
    },
    {
      name: "desktop",
      use: {
        viewport: { width: 1366, height: 768 }
      }
    }
  ],
  webServer: {
    command: "npm run dev -- --host 0.0.0.0 --port 5173",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe"
  }
});
