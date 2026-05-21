const { test, expect } = require("bun:test");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

test("README and guides describe the split LAS/LAZ size ceilings", () => {
  const readme = read("README.md");
  const readmeEn = read("docs/README.en.md");
  const readmeJa = read("docs/README.ja.md");
  const assetsGuide = read("assets/README.md");
  const ops = read("PointCloudWorkbench_運用手順書.md");
  const ref = read("PointCloudWorkbench_実装リファレンス.md");
  const index = read("PointCloudWorkbench_ドキュメント索引.md");
  const html = read("PointCloudWorkbench.html");

  expect(readme).toContain("LAS files above 3GB and LAZ files above 2GB are rejected");
  expect(readme).toContain("Chrome / Edge の最新版のみ");
  expect(readme).toContain("Safari and Firefox are intentionally unsupported");
  expect(readmeEn).toContain("LAS files above 3GB and LAZ files above 2GB are rejected");
  expect(readmeEn).toContain("Chrome / Edge only");
  expect(readmeJa).toContain("LAS は 3GB超、LAZ は 2GB超で読み込み不可");
  expect(readmeJa).toContain("Chrome / Edge の最新版のみ対応");
  expect(readmeJa).toContain("Safari、Firefox、古いブラウザーは対応対象外");
  expect(ops).toContain("LAS は 3GB超、LAZ は 2GB超で読み込み不可");
  expect(ops).toContain("Chrome / Edge の最新版のみ対応");
  expect(ref).toContain("LAS は `3GB超`、LAZ は `2GB超` を拒否");
  expect(index).toContain("LAS は `3GB超`、LAZ は `2GB超` を拒否");
  expect(html).toContain(".las 最大3GB / .laz 最大2GB");
  expect(readme).toContain("chunked LAS loading");
  expect(readme).toContain("WASM heap writes");
  expect(readme).toContain("ブラウザ言語");
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

test("CRS diagnostics docs keep local-only and no-conversion boundaries aligned", () => {
  const readme = read("README.md");
  const readmeEn = read("docs/README.en.md");
  const readmeJa = read("docs/README.ja.md");
  const ops = read("PointCloudWorkbench_運用手順書.md");
  const ref = read("PointCloudWorkbench_実装リファレンス.md");
  const index = read("PointCloudWorkbench_ドキュメント索引.md");
  const spec = read("docs/crs-diagnostics-final-spec.ja.md");
  const plan = read("docs/crs-diagnostics-implementation-plan.ja.md");

  expect(readme).toContain("CRS diagnostics");
  expect(readme).toContain("coordinate conversion");
  expect(readme).toContain("no LAS/LAZ upload");
  expect(readmeEn).toContain("CRS diagnostics");
  expect(readmeEn).toContain("do not perform coordinate conversion");
  expect(readmeJa).toContain("CRS 診断");
  expect(readmeJa).toContain("座標変換");
  expect(readmeJa).toContain("サーバー側 CRS 処理は行いません");
  expect(ops).toContain("CRS 診断の確認");
  expect(ops).toContain("ローカルファイル名、点群 payload、座標配列は含まれない");
  expect(ref).toContain("readLASProjectionRecordsFromFile()");
  expect(ref).toContain("座標変換、EPSG DB 参照");
  expect(index).toContain("LAS/LAZ アップロードは行いません");
  expect(spec).toContain("座標変換」ではなく");
  expect(plan).toContain("EVLR header を先に読み");
});
