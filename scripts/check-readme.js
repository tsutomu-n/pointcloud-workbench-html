const fs = require("fs");

const requiredText = new Map([
  ["README.md", [
    "# PointCloudWorkbench",
    "[日本語](./docs/README.ja.md)",
    "PointCloudWorkbench.html?lang=en&demo=river",
    "Client-Max / Server-Zero",
    "are not uploaded",
    "bun test",
  ]],
  ["docs/README.ja.md", [
    "# PointCloudWorkbench",
    "[English](../README.md)",
    "PointCloudWorkbench.html?lang=ja&demo=river",
    "Client-Max / Server-Zero",
    "アップロードしません",
  ]],
  ["docs/README.en.md", ["[English README](../README.md)"]],
]);

for (const [file, snippets] of requiredText) {
  const content = fs.readFileSync(file, "utf8");
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      console.error(`${file} に必要な記述がありません: ${snippet}`);
      process.exitCode = 1;
    }
  }
}

if (!process.exitCode) console.log("README チェック OK");
