# PointCloudWorkbench

timestamp="2026-11-21(土)_19:56 JST"

[日本語](./docs/README.ja.md) · [中文快速入门](./docs/quickstart.zh.md) · [Project website](https://tsutomu-n.github.io/pointcloud-workbench-html/)

Inspect LAS and LAZ point clouds in your browser. Use 3D and 2D views, cross-sections, measurements, and density overlays to explore your data. No installation or build step is required.

## Quick start

The app supports Japanese, English, and Simplified Chinese. Select a language in the upper-right corner or open the [Chinese river demo](https://tsutomu-n.github.io/pointcloud-workbench-html/PointCloudWorkbench.html?lang=zh&demo=river).

- [Try the river and bridge sample](https://tsutomu-n.github.io/pointcloud-workbench-html/PointCloudWorkbench.html?lang=en&demo=river) in the latest Chrome or Edge. Open the bridge cross-section, measure between A and B, or use **Explore density** to find the gap on the right bank.
- [Open your own LAS or LAZ file](https://tsutomu-n.github.io/pointcloud-workbench-html/PointCloudWorkbench.html?lang=en&open=file). Select a file, review the estimated memory use and display ratio, then open with recommended settings or change the quality preset.
- On a phone, drag with one finger to rotate in 3D or move in 2D. Pinch to zoom or drag with two fingers to pan. Use **2D top / 3D**, **Fit**, and **Tools** above the model.

## What you can inspect

- Color by elevation or classification, inspect cross-sections, and review point counts and density.
- Measure distance, slope, polylines, and XY projected area. Measurements snap to displayed points and depend on the source coordinate units. Use **Download history CSV** to save up to 20 measurements. Each row identifies a picked point in source coordinates. The first row of each measurement includes its results. 3D distance and slope require known horizontal and vertical length units.
- Check CRS diagnostics and acquisition metadata. Limited coordinate conversion estimates the bounds center for supported JGD2011 Japan Plane Rectangular CRS codes. See the [CRS diagnostics guide (Japanese)](./docs/crs-diagnostics-final-spec.ja.md) for interpretation and limitations.

## Requirements and privacy

- Latest Chrome or Edge with WebGL. Safari and Firefox are intentionally unsupported.
- LAS files above 3GB and LAZ files above 2GB are rejected. LAS between 2GB and 3GB is experimental. Start with **LOW** quality for large files.
- **Client-Max / Server-Zero.** Point cloud files are processed locally in the browser and are not uploaded. The app needs network access to load libraries from CDNs. External map links pass the displayed coordinates to the map provider when clicked.

## Development

Open [PointCloudWorkbench.html](./PointCloudWorkbench.html) in Chrome or Edge to run the single-file app locally.

```sh
bun test scripts/*.test.js
bun scripts/check-readme.js
bun scripts/check-server-zero.js
```

[English demo guide](./docs/quickstart.en.md) · [Documentation index (Japanese)](./PointCloudWorkbench_ドキュメント索引.md) · [Contributing](./CONTRIBUTING.md) · [Security](./SECURITY.md) · [Code of conduct](./CODE_OF_CONDUCT.md) · [MIT license](./LICENSE)
