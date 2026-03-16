const { test, expect } = require("bun:test");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

test("repository includes a license file for public distribution", () => {
  const licensePath = path.join(rootDir, "LICENSE");

  expect(fs.existsSync(licensePath)).toBe(true);
  expect(fs.readFileSync(licensePath, "utf8").trim().length).toBeGreaterThan(0);
});
