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
  const sectionTrigger = page.getByRole("button", { name: "See the bridge cross-section", exact: true });
  await sectionTrigger.click();
  const section = page.getByRole("dialog", { name: "Cross-section through the bridge" });
  await section.waitFor();
  assert.equal(await section.locator("#sliceThickness").inputValue(), "5");
  assert.equal(await section.locator("#bridgeSliceMap").getAttribute("data-thickness"), "5");
  assert.equal(await section.getByRole("button", { name: "Close", exact: true }).evaluate(button => button === document.activeElement), true);
  await section.getByRole("button", { name: "Widen slice" }).click();
  assert.equal(await section.locator("#bridgeSliceMap").getAttribute("data-thickness"), await section.locator("#sliceThickness").inputValue());
  const expectedSliceCount = await section.locator("#sliceThickness").evaluate(slider => {
    const halfWidth = Number(slider.value) / 2;
    const coordinates = pointCloud.userData.sourcePositions;
    let count = 0;
    for (let i = 1; i < coordinates.length; i += 3) {
      if (Math.abs(coordinates[i]) <= halfWidth) count++;
    }
    return count.toLocaleString();
  });
  assert.equal(await section.locator("#bridgeSlicePointCount").innerText(), expectedSliceCount);
  await section.locator("#sliceThickness").press("ArrowRight");
  assert.equal(await section.locator("#bridgeSliceMap").getAttribute("data-thickness"), await section.locator("#sliceThickness").inputValue());
  await page.keyboard.press("Escape");
  await section.waitFor({ state: "hidden" });
  assert.equal(await sectionTrigger.evaluate(button => button === document.activeElement), true);
  await page.getByRole("button", { name: "Measure bridge", exact: true }).click();
  await page.evaluate(() => {
    for (const index of [0, 1]) {
      const source = getSourcePointAtIndex(index);
      handleMeasurementPoint({ index, source, display: sourceToDisplayPoint(source) });
    }
  });
  assert.equal(await page.locator("#bridgeGuideDistance").isVisible(), false);
  assert.equal(await page.locator('[data-sample-step="measure"]').getAttribute("data-complete"), null);
  await page.getByRole("button", { name: "Measure bridge", exact: true }).click();
  for (const name of ["Select A", "Select B"]) {
    await page.getByRole("button", { name, exact: true }).click();
  }
  assert.match(await page.locator("#bridgeGuideDistance").innerText(), /60\.000 m/);
  assert.match(await page.locator("#measurementSummary").innerText(), /60\.000/);
  await page.locator('button[onclick="copyMeasurementResult()"]').click();
  await page.waitForFunction(async () => (await navigator.clipboard.readText()).includes("Distance: 60.000 m equivalent"));
  await page.getByRole("button", { name: "Explore density", exact: true }).click();
  await page.waitForFunction(() => densityOverlayState.enabled);
  await page.getByRole("button", { name: "Inspect the empty cell" }).click();
  assert.match(await page.locator("#sampleGapResult").innerText(), /0 points.*37\.5 m².*0 points\/m²/s);
  assert.equal(await page.evaluate(() => {
    const cell = statsData.diagnosticsReport.densityGrid.emptyInteriorCells[0];
    const attribute = sampleGapOutline.geometry.getAttribute("position");
    const corners = [
      [cell.minX, cell.minY], [cell.maxX, cell.minY], [cell.maxX, cell.maxY], [cell.minX, cell.maxY],
    ];
    return document.getElementById("sampleGapResult").dataset.cell === `${cell.row}:${cell.column}` &&
      attribute.count === corners.length &&
      corners.every(([x, y], index) => {
        const projected = sourceToDisplayPoint({ x, y, z: statsData.header.minZ + 0.4 });
        return Math.abs(attribute.getX(index) - projected.x) < 0.001 &&
          Math.abs(attribute.getZ(index) - projected.z) < 0.001;
      });
  }), true);
  const savedMeasurements = await page.evaluate(() => measurementState.history.length);
  await page.getByRole("button", { name: "Measure bridge", exact: true }).click();
  assert.equal(await page.evaluate(() => densityOverlayState.enabled), false);
  await page.getByRole("button", { name: "Select A", exact: true }).click();
  await sectionTrigger.click();
  await section.getByRole("button", { name: "Close", exact: true }).click();
  assert.equal(await page.evaluate(() => measurementState.selectedPoints.length), 0);
  assert.equal(await page.evaluate(() => measurementState.enabled), false);
  assert.equal(await page.evaluate(() => measurementState.history.length), savedMeasurements);
  await page.getByRole("button", { name: "Hide sample guide", exact: true }).press("Enter");
  const showGuide = page.getByRole("button", { name: "Show sample guide", exact: true });
  assert.equal(await showGuide.evaluate(button => document.activeElement === button), true);
  await showGuide.press("Enter");
  assert.equal(await page.getByRole("button", { name: "Hide sample guide", exact: true })
    .evaluate(button => document.activeElement === button), true);
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

  const touchPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await touchPage.goto(`${base}/PointCloudWorkbench.html?lang=ja`);
  const entry = touchPage.getByRole("button", { name: "河川サンプルを試す", exact: true });
  await entry.waitFor();
  const box = await entry.boundingBox();
  assert.ok(box.y >= 0 && box.y + box.height <= 844);
  assert.equal(await touchPage.evaluate(() => document.documentElement.scrollWidth), 390);
  await entry.click();
  const mobileMode = touchPage.getByText("サンプルモード · 河川と橋", { exact: true });
  await mobileMode.waitFor();
  assert.ok((await mobileMode.boundingBox()).y < 844);

  for (const width of [390, 320]) {
    await touchPage.setViewportSize({ width, height: 844 });
    await touchPage.getByRole("button", { name: "橋を横切る断面を見る", exact: true }).click();
    const dialog = touchPage.getByRole("dialog", { name: "橋を横切る断面" });
    const close = dialog.getByRole("button", { name: "閉じる", exact: true });
    const closeBox = await close.boundingBox();
    assert.ok(closeBox.x >= 0 && closeBox.x + closeBox.width <= width);
    assert.equal(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth), true);
    const thickness = dialog.locator("#sliceThickness");
    const before = Number(await thickness.inputValue());
    await dialog.getByRole("button", { name: "断面を広くする" }).tap();
    assert.ok(Number(await thickness.inputValue()) > before);
    await close.tap();
    await dialog.waitFor({ state: "hidden" });
  }
  await touchPage.setViewportSize({ width: 390, height: 844 });
  await touchPage.getByRole("button", { name: "自分のファイルを開く", exact: true }).click();
  await touchPage.getByRole("alertdialog").getByRole("button", { name: "戻る", exact: true }).click();
  await mobileMode.waitFor({ state: "hidden" });
  await touchPage.locator("#fileInput").setInputFiles(new URL("../../demo/pointcloud-demo-sample.las", import.meta.url).pathname);
  await touchPage.locator("#proceedToQuality").click();
  await touchPage.locator("#qualitySelectPanel").waitFor();
  await touchPage.getByRole("button", { name: "読み込み開始", exact: true }).click();
  await touchPage.waitForFunction(() => workflowState.step === "complete" && statsData.displayPoints === 4096);
  assert.equal(await mobileMode.isVisible(), false);
  // Use a real gap between displayed X coordinates in the ordinary LAS.
  const gapWidth = await touchPage.evaluate(() => {
    const coordinates = pointCloud.geometry.getAttribute("position").array;
    const xs = [];
    for (let i = 0; i < coordinates.length; i += 3) xs.push(coordinates[i]);
    xs.sort((a, b) => a - b);
    let width = 0;
    let center = 0;
    for (let i = 1; i < xs.length; i++) {
      if (xs[i] - xs[i - 1] <= width) continue;
      width = xs[i] - xs[i - 1];
      center = (xs[i] + xs[i - 1]) / 2;
    }
    create2DSliceModal([{ axis: "X", position: 0, coordinate: center }, { axis: "Y", position: 0 }]);
    return width;
  });
  assert.ok(gapWidth > 0.1);
  const ordinaryThickness = touchPage.locator("#sliceThickness");
  await ordinaryThickness.fill("0.1");
  assert.equal(await ordinaryThickness.inputValue(), "0.1");
  assert.equal(await touchPage.locator("#thicknessValue").innerText(), "0.1");
  await touchPage.getByRole("dialog", { name: "2D断面ビュー" })
    .getByRole("button", { name: "閉じる", exact: true }).tap();
  console.log("River cross-section, bridge measurement, density, failure recovery, touch controls, and own LAS passed");
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
