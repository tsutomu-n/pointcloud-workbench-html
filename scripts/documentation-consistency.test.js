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
  expect(readme).toContain("Chrome / Edge only");
  expect(readme).toContain("Safari and Firefox are intentionally unsupported");
  expect(readmeJa).toContain("LAS は 3GB超、LAZ は 2GB超で読み込み不可");
  expect(readmeJa).toContain("Chrome / Edge の最新版のみ対応");
  expect(readmeJa).toContain("Safari、Firefox、古いブラウザーは対応対象外");
  expect(ops).toContain("LAS は 3GB超、LAZ は 2GB超で読み込み不可");
  expect(ops).toContain("Chrome / Edge の最新版のみ対応");
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

test("OSS docs keep Client-Max and Server-Zero policy aligned", () => {
  const contributing = read("CONTRIBUTING.md");
  const security = read("SECURITY.md");
  const quickstart = read("docs/quickstart.ja.md");
  const junior = read("docs/for-junior-se.ja.md");
  const runtime = read("docs/runtime-model.ja.md");
  const cloudflare = read("docs/cloudflare-pages-static-only.ja.md");
  const architecture = read("docs/architecture-client-max.ja.md");
  const faq = read("docs/faq.ja.md");

  for (const doc of [contributing, security, quickstart, junior, runtime, architecture, faq]) {
    expect(doc).toMatch(/アップロードしません|アップロードしない|外部送信/);
  }

  expect(quickstart).toContain("最新の Google Chrome または Microsoft Edge");
  expect(cloudflare).toContain("Pages Functions");
  expect(cloudflare).toContain("Workers fetch handler");
  expect(architecture).toContain("ユーザーPC側の責務");
});
