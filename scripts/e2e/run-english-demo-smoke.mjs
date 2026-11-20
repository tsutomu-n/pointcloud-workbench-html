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
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "dark", permissions: ["clipboard-read", "clipboard-write"] });
  page.setDefaultTimeout(10000);
  const base = `http://127.0.0.1:${server.address().port}`;
  await page.addInitScript(() => localStorage.setItem("lastLasFileName", "テスト用小規模モデル"));
  await page.goto(`${base}/PointCloudWorkbench.html?lang=zh`);
  const appBrand = page.getByRole("button", { name: "PointCloudWorkbench", exact: true });
  const favicon = await page.locator('link[rel="icon"]').getAttribute("href", { timeout: 1500 });
  assert.ok(favicon?.startsWith("data:image/svg+xml,"));
  assert.equal(await appBrand.locator("img").evaluate(img => img.complete && img.naturalWidth > 0), true);
  assert.equal(await page.evaluate(async () => {
    const loaded = await document.fonts.load('600 16px "Barlow Semi Condensed"', "PointCloudWorkbench");
    return loaded.length === 1 && loaded[0].status === "loaded";
  }), true);
  await page.getByRole("button", { name: "Try the river sample", exact: true }).waitFor();
  assert.equal(await page.locator("html").getAttribute("lang"), "en");
  assert.equal(await page.getByRole("button", { name: "Choose sample data", exact: true }).count(), 0);
  assert.equal(await page.locator("#lastFileInfo").isVisible(), false);
  assert.equal(await page.locator("#runtimeStatusPanel").getAttribute("open"), null);
  await page.evaluate(() => {
    localStorage.setItem("lastLasFileName", "調査.las");
    updateLastFileInfo();
  });
  assert.equal(await page.locator("#lastFileName").innerText(), "調査.las");
  await page.goto(`${base}/index.html?lang=en`);
  const heading = page.getByRole("heading", { level: 1, name: "PointCloudWorkbench", exact: true });
  await heading.waitFor();
  assert.equal(await page.locator('link[rel="icon"]').getAttribute("href"), favicon);
  assert.equal(await heading.locator("img").evaluate(img => img.complete && img.naturalWidth > 0), true);
  const landingTheme = page.getByRole("button", { name: "Light theme", exact: true });
  assert.equal(await landingTheme.getAttribute("aria-pressed"), "false");
  await landingTheme.press("Enter");
  assert.equal(await landingTheme.getAttribute("aria-pressed"), "true");
  await page.getByRole("link", { name: "Try the river sample", exact: true }).click();
  await page.getByText("Sample mode · River and bridge", { exact: true }).waitFor();
  const appTheme = page.getByRole("button", { name: "Light theme", exact: true });
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  assert.equal(await appTheme.getAttribute("aria-pressed"), "true");
  const lightBackground = await page.evaluate(() => scene.background.getHexString());
  await appTheme.press("Space");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.waitForFunction(background => scene.background.getHexString() !== background, lightBackground);
  assert.equal(await page.evaluate(() => statsData.displayPoints), 23746);
  assert.equal(await page.locator("#qualitySelectPanel").isVisible(), false);
  const sampleHelp = page.locator("#riverDemoMode button[data-sample-help]");
  assert.equal(await sampleHelp.count(), 5);
  const helpState = () => page.evaluate(() => ({
    is2DMode, statsVisible, measuring: measurementState.enabled,
    density: densityOverlayState.enabled, sliceOpen: !!document.getElementById("slice2DModal")?.open,
  }));
  const beforeHelp = await helpState();
  for (const title of ["3D / Top view", "Statistics", "Bridge cross-section", "Measure the bridge", "Explore density"]) {
    const trigger = page.getByRole("button", { name: `Help: ${title}`, exact: true });
    await trigger.press("Enter");
    const help = page.getByRole("dialog", { name: title, exact: true });
    await help.waitFor();
    assert.equal(await help.getByRole("button", { name: "Close", exact: true })
      .evaluate(button => document.activeElement === button), true);
    assert.deepEqual(await helpState(), beforeHelp);
    await page.keyboard.press("Escape");
    await help.waitFor({ state: "hidden" });
    assert.equal(await trigger.evaluate(button => document.activeElement === button), true);
  }
  await page.keyboard.press("h");
  await page.getByRole("heading", { name: "Keyboard and mouse controls" }).waitFor();
  await page.keyboard.press("Escape");
  const sampleStats = page.getByRole("button", { name: "Statistics", exact: true });
  assert.equal(await sampleStats.count(), 1);
  await sampleStats.click();
  assert.match(await page.locator("#statsPanel").innerText(), /Potential density gaps/);
  assert.doesNotMatch(await page.locator("#statsPanel").innerText(), /欠測候補/);
  await page.locator("#statsPanel").getByRole("button", { name: "Close", exact: true }).click();
  assert.equal(await sampleStats.evaluate(button => document.activeElement === button), true);
  const sectionTrigger = page.getByRole("button", { name: "See the bridge cross-section", exact: true });
  await sectionTrigger.click();
  const section = page.getByRole("dialog", { name: "Cross-section through the bridge" });
  await section.waitFor();
  assert.equal(await section.locator("#sliceThickness").inputValue(), "5");
  assert.match(await section.locator("#bridgeSliceThicknessHint").innerText(), /band.*point count/);
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
  assert.equal(await page.evaluate(() => measurementState.selectedPoints.length), 0);
  await page.getByRole("button", { name: "Measure bridge", exact: true }).click();
  for (const name of ["Select A", "Select B"]) {
    await page.getByRole("button", { name, exact: true }).click();
  }
  assert.match(await page.locator("#bridgeGuideDistance").innerText(), /60\.000 m/);
  const bridgeResult = page.locator("#bridgeGuideDistance");
  assert.match(await bridgeResult.innerText(), /Added to this session's history/);
  await bridgeResult.getByRole("button", { name: "Copy CSV", exact: true }).click();
  await page.waitForFunction(async () => (await navigator.clipboard.readText()).includes("60.000"));
  assert.match(await page.locator("#measurementSummary").innerText(), /60\.000/);
  await page.locator('button[onclick="copyMeasurementResult()"]').click();
  await page.waitForFunction(async () => (await navigator.clipboard.readText()).includes("Distance: 60.000 m equivalent"));
  await page.getByRole("button", { name: "Start measuring", exact: true }).click();
  await page.evaluate(() => {
    setMeasurementMode("areaXY");
    for (const index of [0, 1, 121]) {
      const source = getSourcePointAtIndex(index);
      handleMeasurementPoint({ index, source, display: sourceToDisplayPoint(source) });
    }
  });
  assert.match(await page.locator("#measurementStatus").innerText(), /3 points selected/);
  assert.doesNotMatch(await page.locator("#measurementHistoryList").innerText(), /[\u3040-\u30ff\u4e00-\u9fff]/);
  await page.locator("#measurementHistoryList .measurement-history-item").first().hover();
  assert.match(await page.getByRole("tooltip").locator(".measurement-tooltip-title").innerText(), /m equivalent/);
  const historyCount = await page.evaluate(() => measurementState.history.length);
  await page.getByRole("button", { name: "Clear draft points", exact: true }).click();
  assert.equal(await page.evaluate(() => measurementState.selectedPoints.length), 0);
  assert.equal(await page.evaluate(() => measurementState.history.length), historyCount);
  await page.locator("#measurementHistoryList .measurement-history-distance").first().click();
  await page.getByRole("button", { name: "Deselect history item", exact: true }).click();
  assert.equal(await page.evaluate(() => measurementState.selectedRecordId), null);
  await page.getByRole("button", { name: "Delete all history", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(await page.evaluate(() => measurementState.history.length), historyCount);
  await page.locator("#measurementHistoryList").getByRole("button", { name: "Delete", exact: true }).first().click();
  assert.equal(await bridgeResult.isVisible(), false);
  assert.equal(await page.evaluate(() => measurementState.history.length), historyCount - 1);
  await page.getByRole("button", { name: "Open slicing controls", exact: true }).click();
  const slicing = page.locator("#sliceControlPanel");
  assert.equal(await slicing.evaluate(node => !!node.closest(".slice-section")), true);
  await slicing.locator("#sliceZCheck").check();
  const originalPlane = await page.evaluate(() => pointCloud.material.clippingPlanes[0].normal.z);
  assert.equal(await page.evaluate(() => {
    window.set2DView("top");
    camera.updateMatrixWorld();
    const planes = pointCloud.material.clippingPlanes;
    const rect = renderer.domElement.getBoundingClientRect();
    const projected = sourceToDisplayPoint({ x: 0, y: 60, z: 0 }).project(camera);
    const event = {
      clientX: rect.left + (projected.x + 1) * rect.width / 2,
      clientY: rect.top + (1 - projected.y) * rect.height / 2,
    };
    const clippedHit = pickMeasurementPoint(event);
    pointCloud.material.clippingPlanes = [];
    try {
      return clippedHit === null && pickMeasurementPoint(event) !== null;
    } finally {
      pointCloud.material.clippingPlanes = planes;
    }
  }), true);
  await slicing.getByRole("checkbox", { name: "Show the opposite side", exact: true }).last().check();
  assert.equal(await page.evaluate(() => pointCloud.material.clippingPlanes[0].normal.z), -originalPlane);
  await page.getByRole("button", { name: "Disable slicing", exact: true }).click();
  assert.equal(await page.evaluate(() => pointCloud.material.clippingPlanes.length), 0);
  await page.getByRole("button", { name: "Explore density", exact: true }).click();
  await page.waitForFunction(() => densityOverlayState.enabled);
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
  const measureBridge = page.getByRole("button", { name: "Measure bridge", exact: true });
  await measureBridge.click();
  assert.equal(await page.evaluate(() => densityOverlayState.enabled), false);
  const endMarker = page.getByRole("button", { name: "Bridge end A", exact: true });
  const markerLeft = await endMarker.evaluate(button => button.style.left);
  const originalZoom = await page.evaluate(() => camera.zoom);
  await page.getByRole("button", { name: "Zoom in", exact: true }).press("Space");
  assert.ok(await page.evaluate(() => camera.zoom) > originalZoom);
  await page.waitForFunction(left => document.querySelector("#bridgeEndMarkers button").style.left !== left, markerLeft);
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  assert.equal(await page.evaluate(() => camera.zoom), originalZoom);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Fit to view", exact: true }).click();
  assert.equal(await page.evaluate(() => camera.zoom), originalZoom);
  await page.getByRole("button", { name: "Select A", exact: true }).click();
  await measureBridge.click();
  assert.equal(await page.getByRole("button", { name: "Select B", exact: true }).evaluate(button => button === document.activeElement), true);
  await page.getByRole("button", { name: "Help: Measure the bridge", exact: true }).click();
  await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => measurementState.selectedPoints.length), 1);
  await sectionTrigger.click();
  await section.getByRole("button", { name: "Close", exact: true }).click();
  assert.equal(await page.evaluate(() => measurementState.selectedPoints.length), 1);
  assert.equal(await page.evaluate(() => measurementState.enabled), true);
  await page.getByRole("button", { name: "Explore density", exact: true }).click();
  const resumeBridge = page.getByRole("button", { name: "Resume bridge measurement", exact: true });
  await resumeBridge.waitFor();
  assert.equal(await page.evaluate(() => measurementState.enabled), false);
  await resumeBridge.click();
  assert.equal(await page.evaluate(() => measurementState.selectedPoints.length), 1);
  assert.equal(await page.evaluate(() => densityOverlayState.enabled), false);
  await page.locator("#riverDemoMode").getByRole("button", { name: "Back to 3D", exact: true }).click();
  await resumeBridge.waitFor();
  await resumeBridge.click();
  assert.equal(await page.evaluate(() => measurementState.selectedPoints.length), 1);
  await page.getByRole("button", { name: "Hide sample guide", exact: true }).press("Enter");
  const showGuide = page.getByRole("button", { name: "Show sample guide", exact: true });
  assert.equal(await showGuide.evaluate(button => document.activeElement === button), true);
  assert.match(await page.locator("#bridgeGuideProgress").innerText(), /1 \/ 2/);
  await page.getByRole("button", { name: "Clear bridge points", exact: true }).click();
  assert.match(await page.locator("#bridgeGuideProgress").innerText(), /0 \/ 2/);
  await page.getByRole("button", { name: "Select B", exact: true }).click();
  await page.getByRole("button", { name: "Cancel bridge measurement", exact: true }).click();
  assert.equal(await page.evaluate(() => measurementState.selectedPoints.length), 0);
  assert.equal(await page.evaluate(() => measurementState.enabled), false);
  assert.equal(await page.evaluate(() => measurementState.history.length), savedMeasurements);
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
  const mobileHelp = touchPage.getByRole("button", { name: "ヘルプ: 橋の断面", exact: true });
  await mobileHelp.tap();
  const mobileHelpDialog = touchPage.getByRole("dialog", { name: "橋の断面", exact: true });
  await mobileHelpDialog.getByRole("button", { name: "閉じる", exact: true }).tap();
  await mobileHelpDialog.waitFor({ state: "hidden" });
  await touchPage.locator("#languageSelector").selectOption("en");
  const sectionLayout = await touchPage.locator(".section-width-control").evaluate(element => {
    const box = element.getBoundingClientRect();
    const hint = element.querySelector("#sectionDiagnosticsStatus").getBoundingClientRect();
    const slider = element.querySelector("input[type=range]").getBoundingClientRect();
    const ground = element.querySelector("input[type=checkbox]").getBoundingClientRect();
    return { width: box.width, hintWidth: hint.width, afterSlider: ground.top >= slider.bottom };
  });
  assert.ok(sectionLayout.width > 200 && sectionLayout.hintWidth === sectionLayout.width && sectionLayout.afterSlider);
  await touchPage.locator("#languageSelector").selectOption("ja");

  for (const width of [390, 320]) {
    await touchPage.setViewportSize({ width, height: 720 });
    const brandFits = await touchPage.locator("#appTitle").evaluate(element => {
      const wordmark = element.querySelector(".brand-wordmark");
      const actions = document.querySelector(".ec-topbar__actions");
      return wordmark.clientWidth === wordmark.scrollWidth &&
        element.getBoundingClientRect().right + 5 <= actions.getBoundingClientRect().left;
    });
    assert.equal(brandFits, true);
    await touchPage.getByRole("button", { name: "橋を横切る断面を見る", exact: true }).click();
    const dialog = touchPage.getByRole("dialog", { name: "橋を横切る断面" });
    const close = dialog.getByRole("button", { name: "閉じる", exact: true });
    const closeBox = await close.boundingBox();
    assert.ok(closeBox.x >= 0 && closeBox.x + closeBox.width <= width);
    assert.equal(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth), true);
    const thickness = dialog.locator("#sliceThickness");
    const thicknessBox = await thickness.boundingBox();
    const chartBox = await dialog.locator(".slice-dialog-plots canvas").boundingBox();
    assert.ok(thicknessBox.y + thicknessBox.height < chartBox.y && chartBox.y + chartBox.height <= 720);
    const before = Number(await thickness.inputValue());
    await dialog.getByRole("button", { name: "断面を広くする" }).tap();
    assert.ok(Number(await thickness.inputValue()) > before);
    await close.tap();
    await dialog.waitFor({ state: "hidden" });
  }
  await touchPage.setViewportSize({ width: 320, height: 720 });
  await touchPage.getByRole("button", { name: "橋を測る", exact: true }).tap();
  const bridgeChoicesFit = await touchPage.locator("#bridgeGuideChoices").evaluate(choices => {
    const bounds = choices.getBoundingClientRect();
    const panel = document.getElementById("rightPanel").getBoundingClientRect();
    return bounds.top >= Math.max(0, panel.top) && bounds.bottom <= Math.min(innerHeight, panel.bottom);
  });
  assert.ok(bridgeChoicesFit);
  await touchPage.getByRole("button", { name: "A を選ぶ", exact: true }).tap();
  await touchPage.getByRole("button", { name: "B を選ぶ", exact: true }).tap();
  assert.match(await touchPage.locator("#bridgeGuideDistance").innerText(), /60\.000 m/);
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
  assert.equal(await touchPage.getByRole("button", { name: /^ヘルプ:/ }).count(), 0);
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
  const unsupported = await browser.newPage({
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  });
  await unsupported.addInitScript(() => Object.defineProperty(Navigator.prototype, "userAgentData", { get: () => undefined, configurable: true }));
  await unsupported.goto(`${base}/PointCloudWorkbench.html?lang=en`);
  await unsupported.getByRole("heading", { name: "Browser compatibility", exact: true }).waitFor();
  assert.match(await unsupported.locator(".compatibility-warning").innerText(), /Safari, Firefox, and older browsers are unsupported/);
  await unsupported.close();
  console.log("River cross-section, bridge measurement, density, failure recovery, touch controls, and own LAS passed");
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
