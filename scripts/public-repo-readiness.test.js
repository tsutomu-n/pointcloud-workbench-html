const { test, expect } = require("bun:test");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

test("README documents public repo development and runtime constraints", () => {
  const readme = read("README.md");

  expect(readme).toContain("## License");
  expect(readme).toContain("## Development");
  expect(readme).toContain("## Testing");
  expect(readme).toContain("## Repository Scope");
  expect(readme).toContain("## CDN / Network Notes");
  expect(readme).toContain("bun");
  expect(readme).toContain("scripts/");
});

test("GitHub Actions CI runs Bun tests and README checks on main push and pull_request", () => {
  const workflowPath = path.join(rootDir, ".github", "workflows", "ci.yml");

  expect(fs.existsSync(workflowPath)).toBe(true);

  const workflow = fs.readFileSync(workflowPath, "utf8");
  expect(workflow).toContain("name: CI");
  expect(workflow).toContain("push:");
  expect(workflow).toContain("pull_request:");
  expect(workflow).toContain("- main");
  expect(workflow).toContain("oven-sh/setup-bun@v2");
  expect(workflow).toContain("bun-version: 1.3.9");
  expect(workflow).toContain(
    "bun test scripts/pointcloud-workbench.test.js scripts/documentation-consistency.test.js scripts/gitignore.test.js scripts/repository-metadata.test.js scripts/public-repo-readiness.test.js"
  );
  expect(workflow).toContain("bun scripts/check-readme.js");
});
