const { test, expect } = require("bun:test");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

test("README and guides describe the split LAS/LAZ size ceilings", () => {
  const readme = read("README.md");
  const ops = read("PointCloudWorkbench_運用手順書.md");
  const ref = read("PointCloudWorkbench_実装リファレンス.md");
  const index = read("PointCloudWorkbench_ドキュメント索引.md");
  const html = read("PointCloudWorkbench.html");

  expect(readme).toContain("LAS は 3GB超、LAZ は 2GB超で読み込み不可");
  expect(ops).toContain("LAS は 3GB超、LAZ は 2GB超で読み込み不可");
  expect(ref).toContain("LAS は `3GB超`、LAZ は `2GB超` を拒否");
  expect(index).toContain("LAS は `3GB超`、LAZ は `2GB超` を拒否");
  expect(html).toContain(".las 最大3GB / .laz 最大2GB");
});
