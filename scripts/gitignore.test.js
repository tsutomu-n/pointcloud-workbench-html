const { test, expect } = require("bun:test");
const fs = require("fs");
const path = require("path");

const gitignorePath = path.join(__dirname, "..", ".gitignore");
const gitignore = fs.readFileSync(gitignorePath, "utf8");

test(".gitignore ignores transient test artifacts but keeps scripts tracked", () => {
  expect(gitignore).toContain("/test-results/");
  expect(gitignore).not.toContain("/scripts/");
});
