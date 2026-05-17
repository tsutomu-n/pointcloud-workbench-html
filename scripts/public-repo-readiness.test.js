const { test, expect } = require("bun:test");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

test("README documents public repo development and runtime constraints", () => {
  const readme = read("README.md");
  const readmeJaPath = path.join(rootDir, "docs", "README.ja.md");
  const assetsGuidePath = path.join(rootDir, "assets", "README.md");

  expect(fs.existsSync(readmeJaPath)).toBe(true);
  expect(fs.existsSync(assetsGuidePath)).toBe(true);
  expect(readme).toContain("Browser-native LAS/LAZ point cloud workbench");
  expect(readme).toContain("No install. No build.");
  expect(readme).toContain("Client-Max / Server-Zero");
  expect(readme).toContain("Chrome / Edge only");
  expect(readme).toContain("Safari and Firefox are intentionally unsupported");
  expect(readme).toContain("Selected LAS/LAZ files are processed locally in the browser and are not uploaded");
  expect(readme).toContain("## Live Demo");
  expect(readme).toContain("## Visual Tour");
  expect(readme).toContain("## Why PointCloudWorkbench");
  expect(readme).toContain("## Try It In 60 Seconds");
  expect(readme).toContain("## Japanese README");
  expect(readme).toContain("browser language");
  expect(readme).toContain("./docs/README.ja.md");
  expect(readme).toContain("assets/landing-hero.png");
  expect(readme).toContain("assets/preflight-panel.png");
  expect(readme).toContain("assets/workspace-3d.png");
  expect(readme).toContain("assets/workspace-2d-slice-stats.png");
  expect(readme).toContain("index.html");
  expect(readme).toContain("## License");
  expect(readme).toContain("## Development");
  expect(readme).toContain("## Testing");
  expect(readme).toContain("## Repository Scope");
  expect(readme).toContain("## CDN / Network Notes");
  expect(readme).toContain("bun");
  expect(readme).toContain("scripts/");
  expect(readme).toContain("https://tsutomu-n.github.io/pointcloud-workbench-html/");
});

test("GitHub Actions CI runs Bun tests and README checks on main push and pull_request", () => {
  const workflowPath = path.join(rootDir, ".github", "workflows", "ci.yml");

  expect(fs.existsSync(workflowPath)).toBe(true);

  const workflow = fs.readFileSync(workflowPath, "utf8");
  expect(workflow).toContain("name: CI");
  expect(workflow).toContain("push:");
  expect(workflow).toContain("pull_request:");
  expect(workflow).toContain("- main");
  expect(workflow).toContain("actions/checkout@v5");
  expect(workflow).not.toContain("actions/checkout@v4");
  expect(workflow).toContain("oven-sh/setup-bun@v2");
  expect(workflow).toContain("bun-version: 1.3.9");
  expect(workflow).toContain(
    "bun test scripts/pointcloud-workbench.test.js scripts/documentation-consistency.test.js scripts/gitignore.test.js scripts/repository-metadata.test.js scripts/public-repo-readiness.test.js scripts/landing-page-i18n.test.js"
  );
  expect(workflow).toContain("bun scripts/check-readme.js");
  expect(workflow).toContain("bun scripts/check-server-zero.js");
});

test("Pages demo assets and deployment workflow are present", () => {
  const indexPath = path.join(rootDir, "index.html");
  const samplePath = path.join(rootDir, "demo", "pointcloud-demo-sample.las");
  const headersPath = path.join(rootDir, "_headers");
  const latestManifestPath = path.join(rootDir, "assets", "latest", "manifest.json");
  const workflowPath = path.join(rootDir, ".github", "workflows", "deploy-pages.yml");

  expect(fs.existsSync(indexPath)).toBe(true);
  expect(fs.existsSync(samplePath)).toBe(true);
  expect(fs.existsSync(headersPath)).toBe(true);
  expect(fs.existsSync(latestManifestPath)).toBe(true);
  expect(fs.readFileSync(samplePath).subarray(0, 4).toString("utf8")).toBe("LASF");

  const index = fs.readFileSync(indexPath, "utf8");
  expect(index).toContain("PointCloudWorkbench | Native LAS/LAZ Viewer");
  expect(index).toContain("[ EXECUTE // 実アプリを起動 ]");
  expect(index).toContain("./PointCloudWorkbench.html");
  expect(index).toContain("01 // SYSTEM CAPABILITIES");
  expect(index).toContain("02 // CONSTRAINTS &amp; REQUIREMENTS");
  expect(index).toContain("03 // ARCHITECTURE &amp; DOCS");
  expect(index).toContain("DATA // SAMPLE LAS");
  expect(index).toContain("Chrome / Edge only");
  expect(index).toContain("Firefox and Safari are not supported");
  expect(index).toContain("LICENSE // MIT. SYSTEM DISTRIBUTED AS SINGLE HTML.");
  expect(index).toContain('id="landingLanguageSelector"');
  expect(index).toContain('const LANDING_SUPPORTED_LANGUAGES = ["ja", "en", "zh"]');
  expect(index).toContain("navigator.languages");
  expect(index).toContain("navigator.language");
  expect(index).toContain("new URLSearchParams(window.location.search)");
  expect(index).toContain('localStorage.getItem("pcwLandingLanguage")');
  expect(index).toContain('localStorage.setItem("pcwLandingLanguage"');
  expect(index).toContain('window.addEventListener("languagechange"');
  expect(index).not.toContain("gsap");
  expect(index).not.toContain("lenis");

  expect(fs.existsSync(workflowPath)).toBe(true);
  const workflow = fs.readFileSync(workflowPath, "utf8");
  expect(workflow).toContain("actions/configure-pages@v5");
  expect(workflow).toContain("actions/checkout@v5");
  expect(workflow).not.toContain("actions/checkout@v4");
  expect(workflow).toContain("oven-sh/setup-bun@v2");
  expect(workflow).toContain("bun-version: 1.3.9");
  expect(workflow).toContain(
    "bun test scripts/pointcloud-workbench.test.js scripts/documentation-consistency.test.js scripts/gitignore.test.js scripts/repository-metadata.test.js scripts/public-repo-readiness.test.js scripts/landing-page-i18n.test.js"
  );
  expect(workflow).toContain("bun scripts/check-readme.js");
  expect(workflow).toContain("bun scripts/check-server-zero.js");
  expect(workflow).toContain("actions/upload-pages-artifact@v4");
  expect(workflow).toContain("actions/deploy-pages@v4");
  expect(workflow).toContain("name: ${{ 'github-pages' }}");
  expect(workflow).toContain("cp _headers site/_headers");
  expect(workflow).toContain("cp assets/latest/manifest.json site/assets/latest/manifest.json");
  expect(workflow).toContain("pointcloud-demo-sample.las");
  expect(workflow).toContain(".nojekyll");
});

test("Server-Zero static assets and PR template document the operating policy", () => {
  const headers = read("_headers");
  const manifest = JSON.parse(read("assets/latest/manifest.json"));
  const prTemplate = read(".github/PULL_REQUEST_TEMPLATE.md");

  expect(headers).toContain("/assets/v*");
  expect(headers).toContain("Cache-Control: public, max-age=31536000, immutable");
  expect(headers).toContain("Cross-Origin-Opener-Policy: same-origin");
  expect(headers).toContain("Cross-Origin-Embedder-Policy: require-corp");
  expect(manifest.runtime.model).toBe("client-max-server-zero");
  expect(manifest.runtime.serverProcessing).toBe(false);
  expect(manifest.runtime.pointCloudUpload).toBe(false);
  expect(manifest.runtime.telemetry).toBe(false);
  expect(prTemplate).toContain("What Changed");
  expect(prTemplate).toContain("Server Load");
  expect(prTemplate).toContain("Selected LAS/LAZ files are not uploaded");
});
