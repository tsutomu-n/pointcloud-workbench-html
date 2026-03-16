const fs = require("fs");

const readmePath = "README.md";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(readmePath)) {
  fail("README.md が存在しません");
}

const content = fs.readFileSync(readmePath, "utf8");

const requiredSnippets = [
  "# PointCloudWorkbench",
  "Browser-native LAS/LAZ point cloud workbench",
  "No install. No build.",
  "## Live Demo",
  "## Visual Tour",
  "## Japanese README",
  "./docs/README.ja.md",
  "browser language",
  "assets/landing-hero.png",
  "assets/preflight-panel.png",
  "assets/workspace-3d.png",
  "assets/workspace-2d-slice-stats.png",
  "## Why PointCloudWorkbench",
  "## Try It In 60 Seconds",
  "## License",
  "## Development",
  "## Testing",
  "## Repository Scope",
  "## CDN / Network Notes",
  "index.html",
  "PointCloudWorkbench.html",
  "https://tsutomu-n.github.io/pointcloud-workbench-html/",
  "Chrome / Edge / Firefox",
  "2GB",
  "MIT",
  "bun",
  "scripts/",
  "PointCloudWorkbench_ドキュメント索引.md",
  "PointCloudWorkbench_運用手順書.md",
  "PointCloudWorkbench_実装リファレンス.md",
];

for (const snippet of requiredSnippets) {
  if (!content.includes(snippet)) {
    fail(`README.md に必要な記述がありません: ${snippet}`);
  }
}

console.log("README チェック OK");
