const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const assetLimitBytes = 25 * 1024 * 1024;

const ignoredDirs = new Set([
  ".git",
  ".tmp",
  ".ai_memory",
  ".serena",
  "node_modules",
  "test-results",
]);

const forbiddenDirs = [
  "functions",
  path.join("src", "functions"),
  "api",
];

const forbiddenRootFiles = ["_worker.js"];

const forbiddenPatterns = [
  {
    pattern: /fetch\s*\(\s*["'`]\/api\//,
    reason: "startup or runtime API calls are not part of the static-only path",
  },
  {
    pattern: /navigator\.sendBeacon\s*\(/,
    reason: "automatic telemetry is not allowed",
  },
  {
    pattern: /sendTelemetry|telemetryEndpoint|errorReportEndpoint/i,
    reason: "automatic telemetry or error reporting endpoints are not allowed",
  },
  {
    pattern: /uploadPointCloud|sendPointCloudToServer|\/upload-point-cloud/i,
    reason: "selected point cloud files must not be uploaded",
  },
  {
    pattern: /D1Database|KVNamespace|DurableObject|R2Bucket/,
    reason: "Cloudflare server-side bindings are not part of the normal path",
  },
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;

    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(absolutePath, files);
    } else {
      files.push(absolutePath);
    }
  }
  return files;
}

function toRelative(absolutePath) {
  return path.relative(rootDir, absolutePath).split(path.sep).join("/");
}

let failed = false;

for (const relativeDir of forbiddenDirs) {
  if (fs.existsSync(path.join(rootDir, relativeDir))) {
    console.error(`[server-zero] Forbidden server directory exists: ${relativeDir}`);
    failed = true;
  }
}

for (const relativeFile of forbiddenRootFiles) {
  if (fs.existsSync(path.join(rootDir, relativeFile))) {
    console.error(`[server-zero] Forbidden Worker entry exists: ${relativeFile}`);
    failed = true;
  }
}

for (const file of walk(rootDir)) {
  const relativeFile = toRelative(file);
  const stat = fs.statSync(file);

  if (stat.size > assetLimitBytes) {
    console.error(
      `[server-zero] File exceeds Cloudflare Pages 25MiB asset limit: ${relativeFile}`,
    );
    failed = true;
  }

  if (relativeFile === "scripts/check-server-zero.js") continue;
  if (!/\.(html|js|mjs|cjs|ts|json|ya?ml)$/.test(relativeFile)) continue;

  const text = fs.readFileSync(file, "utf8");
  for (const { pattern, reason } of forbiddenPatterns) {
    if (pattern.test(text)) {
      console.error(`[server-zero] Forbidden pattern in ${relativeFile}: ${reason}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log("Server-Zero check OK");
