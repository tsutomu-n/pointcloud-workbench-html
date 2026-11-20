#!/usr/bin/env node
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const files = new Map([
  ["/index.html", "text/html; charset=utf-8"],
  ["/PointCloudWorkbench.html", "text/html; charset=utf-8"],
  ["/demo/pointcloud-demo-sample.las", "application/octet-stream"],
  ["/demo/river-bridge-demo.las", "application/octet-stream"],
]);
const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url, "http://localhost");
  try {
    if (!files.has(pathname)) throw new Error("Unknown path");
    const file = await readFile(new URL(`../..${pathname}`, import.meta.url));
    response.writeHead(200, { "Content-Type": files.get(pathname) });
    response.end(file);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.PCW_CHROME || undefined,
    args: ["--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
  page.setDefaultTimeout(10000);
  const base = `http://127.0.0.1:${server.address().port}`;
  await page.goto(`${base}/index.html?lang=en`);
  await page.getByRole("link", { name: "Try the river sample", exact: true }).click();
  await page.getByText("Sample mode · River and bridge", { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => statsData.displayPoints), 23746);
  assert.equal(await page.locator("#qualitySelectPanel").isVisible(), false);
  await page.keyboard.press("h");
  await page.getByRole("heading", { name: "Keyboard and mouse controls" }).waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Bridge section", exact: true }).click();
  await page.locator("#slice2DModal").getByText("2D slice view", { exact: true }).waitFor();
  assert.equal(await page.locator("#sliceThickness").inputValue(), "5");
  await page.locator("#slice2DModal").getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Measure bridge", exact: true }).click();
  for (const label of ["Bridge end A", "Bridge end B"]) {
    await page.getByRole("button", { name: label, exact: true }).click();
  }
  assert.match(await page.locator("#measurementSummary").innerText(), /60\.000/);
  await page.locator('button[onclick="copyMeasurementResult()"]').click();
  await page.waitForFunction(async () => (await navigator.clipboard.readText()).includes("Distance: 60.000 m equivalent"));
  await page.getByRole("button", { name: "Explore density", exact: true }).click();
  await page.waitForFunction(() => densityOverlayState.enabled);
  assert.ok(await page.evaluate(() => statsData.diagnosticsReport.densityGrid.summary.emptyInteriorCells > 0));
  await page.getByRole("button", { name: "Hide sample guide", exact: true }).click();
  await page.getByRole("button", { name: "Show sample guide", exact: true }).click();
  await page.route("**/demo/river-bridge-demo.las", route => route.fulfill({ status: 404 }));
  await page.goto(`${base}/PointCloudWorkbench.html?lang=en`);
  await page.getByRole("button", { name: "Try the river sample", exact: true }).click();
  await page.getByRole("button", { name: "Retry", exact: true }).waitFor();
  assert.notEqual(await page.evaluate(() => workflowState.step), "complete");
  await page.unroute("**/demo/river-bridge-demo.las");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await page.getByText("Sample mode · River and bridge", { exact: true }).waitFor();
  const sampleUrl = "**/demo/river-bridge-demo.las";
  for (const body of [Buffer.alloc(512), (await readFile(new URL("../../demo/river-bridge-demo.las", import.meta.url))).subarray(0, 5000)]) {
    await page.route(sampleUrl, route => route.fulfill({ body }));
    await page.goto(`${base}/PointCloudWorkbench.html?lang=en&demo=river`);
    await page.getByText("Could not read the sample LAS.", { exact: true }).waitFor();
    await page.unroute(sampleUrl);
  }
  let releaseResponse;
  const delayed = new Promise(resolve => { releaseResponse = resolve; });
  await page.route(sampleUrl, async route => {
    await delayed;
    await route.continue().catch(() => {});
  });
  await page.goto(`${base}/PointCloudWorkbench.html?lang=en`);
  await page.getByRole("button", { name: "Try the river sample", exact: true }).click();
  await page.getByText("Fetching the sample LAS...", { exact: true }).first().waitFor();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  releaseResponse();
  await page.unroute(sampleUrl);
  await page.getByRole("button", { name: "Try the river sample", exact: true }).click();
  await page.getByText("Sample mode · River and bridge", { exact: true }).waitFor();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/PointCloudWorkbench.html?lang=ja`);
  const entry = page.getByRole("button", { name: "河川サンプルを試す", exact: true });
  await entry.waitFor();
  const box = await entry.boundingBox();
  assert.ok(box.y >= 0 && box.y + box.height <= 844);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  await entry.click();
  const mobileMode = page.getByText("サンプルモード · 河川と橋", { exact: true });
  await mobileMode.waitFor();
  assert.ok((await mobileMode.boundingBox()).y < 844);

  await page.getByRole("button", { name: "自分のファイルを開く", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "戻る", exact: true }).click();
  await mobileMode.waitFor({ state: "hidden" });
  await page.locator("#fileInput").setInputFiles(new URL("../../demo/pointcloud-demo-sample.las", import.meta.url).pathname);
  await page.locator("#proceedToQuality").click();
  await page.locator("#qualitySelectPanel").waitFor();
  await page.getByRole("button", { name: "読み込み開始", exact: true }).click();
  await page.waitForFunction(() => workflowState.step === "complete" && statsData.displayPoints === 4096);
  assert.equal(await mobileMode.isVisible(), false);
  console.log("River sample, failure recovery, mobile entry, and own LAS passed");
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
