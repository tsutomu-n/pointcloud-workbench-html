#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const ROOT_DIR = process.cwd();
const DEFAULT_LAS = path.resolve(ROOT_DIR, "samples/test.las");
const DEFAULT_LAZ = path.resolve(ROOT_DIR, "samples/test.laz");
const OUT_DIR = path.resolve(ROOT_DIR, ".tmp/e2e");

function parseArgs(argv) {
  const args = { las: DEFAULT_LAS, laz: DEFAULT_LAZ };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--las" && argv[i + 1]) args.las = path.resolve(argv[++i]);
    if (token === "--laz" && argv[i + 1]) args.laz = path.resolve(argv[++i]);
  }
  return args;
}

function existsOrThrow(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
}

function contentTypeFor(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".las")) return "application/octet-stream";
  if (filePath.endsWith(".laz")) return "application/octet-stream";
  return "application/octet-stream";
}

function startStaticServer(rootDir) {
  const server = http.createServer((req, res) => {
    try {
      const rawPath = decodeURIComponent((req.url || "/").split("?")[0]);
      const normalized = path.normalize(rawPath).replace(/^(\.\.[/\\])+/, "");
      const targetPath = path.resolve(rootDir, `.${normalized}`);
      if (!targetPath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
      res.writeHead(200, { "Content-Type": contentTypeFor(targetPath) });
      fs.createReadStream(targetPath).pipe(res);
    } catch (error) {
      res.writeHead(500);
      res.end(`Server error: ${error.message}`);
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to bind static server"));
        return;
      }
      resolve({ server, port: address.port });
    });
  });
}

function assertTrue(value, message) {
  if (!value) throw new Error(message);
}

async function runSingleScenario({ browser, baseUrl, inputPath, label, screenshotName }) {
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: { width: 1600, height: 1000 },
  });
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/PointCloudWorkbench.html`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.eventListenersSetupDone === true, null, { timeout: 30000 });

    await page.setInputFiles("#fileInput", inputPath);
    await page.evaluate(() => {
      const input = document.getElementById("fileInput");
      if (input) input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await page.waitForSelector("#proceedToQuality:not([disabled])", { timeout: 30000 });
    await page.click("#proceedToQuality");
    await page.waitForSelector("#quality-low", { timeout: 10000 });
    await page.click('label.quality-option[data-quality="low"]');
    await page.click('button:has-text("読み込み開始")');

    await page.waitForFunction(
      () => typeof workflowState !== "undefined" && workflowState.step === "complete",
      null,
      { timeout: 540000 },
    );

    await page.click("#statsToggle");
    await page.waitForSelector("#diagnosticCandidateList", { timeout: 10000 });
    await page.waitForTimeout(1200);

    const candidateCount = await page.locator("#diagnosticCandidateList .diagnostic-candidate-btn").count();
    assertTrue(candidateCount > 0, `${label}: no diagnostic candidates`);

    await page.locator("#diagnosticCandidateList .diagnostic-candidate-btn").first().click();
    const markerExists = await page.evaluate(() => typeof diagnosticCandidateMarker !== "undefined" && !!diagnosticCandidateMarker);
    assertTrue(markerExists, `${label}: marker was not created after candidate click`);

    const selectedCopy = await page.evaluate(async () => {
      if (typeof copySelectedDiagnosticCandidate !== "function") return { ok: false, reason: "copy function missing" };
      return await copySelectedDiagnosticCandidate();
    });
    assertTrue(selectedCopy?.ok && String(selectedCopy?.text || "").includes('"kind"'), `${label}: selected copy failed`);

    const summaryCopy = await page.evaluate(async () => {
      if (typeof copyDiagnosticCandidateSummary !== "function") return { ok: false, reason: "summary copy function missing" };
      return await copyDiagnosticCandidateSummary();
    });
    assertTrue(summaryCopy?.ok && String(summaryCopy?.text || "").includes('"total"'), `${label}: summary copy failed`);

    fs.mkdirSync(OUT_DIR, { recursive: true });
    await page.screenshot({
      path: path.resolve(OUT_DIR, screenshotName),
      fullPage: true,
    });

    return {
      label,
      candidateCount,
      screenshot: path.resolve(OUT_DIR, screenshotName),
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  existsOrThrow(args.las, "LAS");
  existsOrThrow(args.laz, "LAZ");

  const { server, port } = await startStaticServer(ROOT_DIR);
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true });

  try {
    const lasResult = await runSingleScenario({
      browser,
      baseUrl,
      inputPath: args.las,
      label: "LAS",
      screenshotName: "las-diagnostics.png",
    });
    const lazResult = await runSingleScenario({
      browser,
      baseUrl,
      inputPath: args.laz,
      label: "LAZ",
      screenshotName: "laz-diagnostics.png",
    });

    console.log("Diagnostics smoke passed");
    console.log(JSON.stringify({ las: lasResult, laz: lazResult }, null, 2));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(`Diagnostics smoke failed: ${error.message}`);
  process.exit(1);
});
