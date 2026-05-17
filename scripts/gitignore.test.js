const { test, expect } = require("bun:test");
const fs = require("fs");
const path = require("path");

const gitignorePath = path.join(__dirname, "..", ".gitignore");
const gitignore = fs.readFileSync(gitignorePath, "utf8");

test(".gitignore ignores transient test artifacts but keeps scripts tracked", () => {
  expect(gitignore).toContain("/test-results/");
  expect(gitignore).toContain("/.serena/");
  expect(gitignore).toContain("/.tmp/");
  expect(gitignore).toContain("/node_modules/");
  expect(gitignore).toContain("/coverage/");
  expect(gitignore).not.toContain("/scripts/");
  expect(gitignore).not.toContain("/docs/");
  expect(gitignore).not.toContain("/.github/");
  expect(gitignore).not.toContain("/assets/");
});
