#!/usr/bin/env node
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const files = new Map([
  ["/index.html", "text/html; charset=utf-8"],
  ["/PointCloudWorkbench.html", "text/html; charset=utf-8"],
  ["/demo/pointcloud-demo-sample.las", "application/octet-stream"],
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
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  page.setDefaultTimeout(10000);
  const base = `http://127.0.0.1:${server.address().port}`;
  await page.goto(`${base}/PointCloudWorkbench.html?lang=en`);
  await page.waitForFunction(() => document.documentElement.lang === "en");
  await page.waitForFunction(() => window.eventListenersSetupDone === true);
  assert.equal(await page.locator("html").getAttribute("lang"), "en");
  await page.getByRole("button", { name: "Load demo sample", exact: true }).click();
  await page.locator('label.quality-option[data-quality="low"]').click();
  assert.doesNotMatch(await page.locator("#qualitySelectPanel").innerText(), /[\u3040-\u30ff\u4e00-\u9fff]/);
  await page.getByRole("button", { name: "Start loading", exact: true }).click();
  await page.waitForFunction(() => workflowState.step === "complete" && statsData.displayPoints === 4096);
  await page.locator("#classificationBtn").click();
  await page.waitForFunction(() => colorMode === "classification");
  await page.getByRole("button", { name: "2D top", exact: true }).click();
  await page.getByText(/Section: [\d,]+ points/).waitFor();
  await page.getByRole("button", { name: "Start measuring", exact: true }).click();
  await page.getByText("Distance: Click the first point", { exact: true }).waitFor();
  // Project known display vertices, then use actual mouse events for picking.
  const measurementPixels = await page.evaluate(() => {
    const positions = pointCloud.geometry.getAttribute("position");
    const rect = renderer.domElement.getBoundingClientRect();
    return [1040, 3090].map((index) => {
      const point = new THREE.Vector3().fromBufferAttribute(positions, index)
        .applyMatrix4(pointCloud.matrixWorld).project(camera);
      return [
        rect.left + ((point.x + 1) * rect.width) / 2,
        rect.top + ((1 - point.y) * rect.height) / 2,
      ];
    });
  });
  for (const [x, y] of measurementPixels) await page.mouse.click(x, y);
  await page.getByText("Horizontal distance", { exact: true }).waitFor();
  assert.match(await page.locator("#measurementSummary").innerText(), /m equivalent/);
  await page.getByRole("button", { name: "Stop measuring", exact: true }).click();
  await page.getByRole("button", { name: "Back to 3D", exact: true }).click();
  await page.getByRole("button", { name: "Enable slicing", exact: true }).click();
  await page.getByRole("button", { name: "Open 2D slice view", exact: true }).click();
  await page.getByText("Enable slicing on at least one axis.", { exact: true }).waitFor();
  await page.locator("#sliceYCheck").check();
  await page.getByRole("button", { name: "Open 2D slice view", exact: true }).click();
  const slice = page.locator("#slice2DModal");
  await slice.getByText("2D slice view", { exact: true }).waitFor();
  assert.doesNotMatch(await slice.innerText(), /[\u3040-\u30ff\u4e00-\u9fff]/);
  await slice.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator("#statsToggle").click();
  await page.locator("#originalPoints").waitFor();
  assert.match(await page.locator("#statsPanel").innerText(), /4,096/);
  assert.doesNotMatch(await page.locator("#statsPanel").innerText(), /[\u3040-\u30ff\u4e00-\u9fff]/);
  await page.locator("#languageSelector").selectOption("ja");
  assert.equal(await page.locator("html").getAttribute("lang"), "ja");
  assert.match(await page.locator("#statsPanel").innerText(), /元データ点数/);
  await page.locator("#homeBtn").click();
  const confirmation = page.getByRole("alertdialog");
  await confirmation.getByRole("button", { name: "戻る", exact: true }).click();
  await page.getByRole("button", { name: "サンプルデータを使用", exact: true }).waitFor();
  await page.goto(`${base}/PointCloudWorkbench.html`);
  await page.getByRole("button", { name: "サンプルデータを使用", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Load demo sample", exact: true }).count(), 0);
  await page.goto(`${base}/index.html?lang=ja`);
  await page.locator("#landingLanguageSelector").selectOption("en");
  await page.locator('a[href*="PointCloudWorkbench.html"]').first().click();
  await page.waitForURL("**/PointCloudWorkbench.html?lang=en");
  await page.getByRole("button", { name: "Load demo sample", exact: true }).waitFor();
  await page.waitForFunction(() => window.eventListenersSetupDone === true);
  await page.locator("#fileInput").setInputFiles({
    name: "invalid.las",
    mimeType: "application/octet-stream",
    buffer: Buffer.alloc(512),
  });
  await page.getByRole("button", { name: "Continue to quality settings", exact: true }).click();
  await page.getByRole("button", { name: "Start loading", exact: true }).click();
  await page.getByText("Load failed: Invalid LAS signature.", { exact: true }).waitFor();
  console.log("English sample workflow and landing link passed");
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
