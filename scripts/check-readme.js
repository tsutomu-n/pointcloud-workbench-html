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
  "LAS/LAZ",
  "## 主な機能",
  "## 使い方",
  "## 動作条件",
  "## ファイル構成",
  "PointCloudWorkbench.html",
  "Chrome / Edge / Firefox",
  "2GB",
  "PointCloudWorkbench_運用手順書.md",
  "PointCloudWorkbench_実装リファレンス.md",
];

for (const snippet of requiredSnippets) {
  if (!content.includes(snippet)) {
    fail(`README.md に必要な記述がありません: ${snippet}`);
  }
}

console.log("README チェック OK");
