const { test, expect } = require("bun:test");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

test("README and guides describe the split LAS/LAZ size ceilings", () => {
  const readme = read("README.md");
  const readmeJa = read("docs/README.ja.md");
  const assetsGuide = read("assets/README.md");
  const ops = read("PointCloudWorkbench_運用手順書.md");
  const ref = read("PointCloudWorkbench_実装リファレンス.md");
  const index = read("PointCloudWorkbench_ドキュメント索引.md");
  const html = read("PointCloudWorkbench.html");

  expect(readme).toContain("LAS files above 3GB and LAZ files above 2GB are rejected");
  expect(readmeJa).toContain("LAS は 3GB超、LAZ は 2GB超で読み込み不可");
  expect(ops).toContain("LAS は 3GB超、LAZ は 2GB超で読み込み不可");
  expect(ref).toContain("LAS は `3GB超`、LAZ は `2GB超` を拒否");
  expect(index).toContain("LAS は `3GB超`、LAZ は `2GB超` を拒否");
  expect(html).toContain(".las 最大3GB / .laz 最大2GB");
  expect(readme).toContain("Chunked LAS loading");
  expect(readme).toContain("WASM heap writes");
  expect(readme).toContain("browser language");
  expect(readmeJa).toContain("LAS の chunked 読み込み");
  expect(readmeJa).toContain("WASM ヒープ直書き");
  expect(readmeJa).toContain("ブラウザ言語");
  expect(readmeJa).toContain("../assets/README.md");
  expect(assetsGuide).toContain("landing-hero.png");
  expect(assetsGuide).toContain("preflight-panel.png");
  expect(assetsGuide).toContain("workspace-3d.png");
  expect(assetsGuide).toContain("workspace-2d-slice-stats.png");
  expect(ref).toContain("parseLASPointsFromFile()");
  expect(ref).toContain("readFileIntoWasmHeap()");
});
