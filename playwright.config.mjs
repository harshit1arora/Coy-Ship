import { defineConfig } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4179",
    launchOptions: { executablePath: process.env.CHROME_PATH || undefined },
  },
  webServer: {
    command: "node --experimental-sqlite server.mjs",
    url: "http://127.0.0.1:4179/feed",
    env: {
      PORT: "4179",
      DB_PATH: path.join(
        mkdtempSync(path.join(tmpdir(), "coy-browser-")),
        "e2e.sqlite",
      ),
    },
  },
});
