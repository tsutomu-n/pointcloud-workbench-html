# PointCloudWorkbench

Browser-native LAS/LAZ point cloud workbench delivered as a single HTML file.

No install. No build. Open the live demo, load a bundled sample LAS, and inspect point clouds in 3D/2D with slice, classification, and statistics tools.

## Live Demo

- Landing Page: `https://tsutomu-n.github.io/pointcloud-workbench-html/`
- Launch App Directly: `https://tsutomu-n.github.io/pointcloud-workbench-html/PointCloudWorkbench.html`
- Bundled Sample LAS: `https://tsutomu-n.github.io/pointcloud-workbench-html/demo/pointcloud-demo-sample.las`
- The landing page can adapt to your browser language (`ja` / `en` / `zh`) and still exposes a manual language switcher.

## Visual Tour

- Planned screenshot assets live under `assets/`.
- `assets/landing-hero.png`: Full-width GitHub Pages landing-page hero showing the dark terminal-like visual identity, oversized `PointCloudWorkbench.` typography, and the three CTA buttons for app launch, sample LAS download, and repository access.
- `assets/preflight-panel.png`: App state immediately after selecting the bundled sample, with the pre-flight panel visible and enough detail to read the load path, risk indicator, file size, source point count, estimated display ratio, and quality presets.
- `assets/workspace-3d.png`: Main 3D workspace after load, showing a point cloud rendered with visible depth and density, the primary control panels, and a viewpoint that makes the browser-native single-file experience feel production-ready rather than experimental.
- `assets/workspace-2d-slice-stats.png`: 2D or slice-oriented inspection state with the statistics panel open, making it obvious that the tool supports cross-section inspection, classification review, and quantitative validation in addition to 3D viewing.
- Detailed image briefs for future screenshots are documented in [`assets/README.md`](./assets/README.md).

## Japanese README

- Japanese README: [`./docs/README.ja.md`](./docs/README.ja.md)

## Why PointCloudWorkbench

- Single HTML delivery. The main application is `PointCloudWorkbench.html` with no build step.
- Browser-native workflow. Open the file in Chrome / Edge / Firefox and start loading `.las` or `.laz`.
- Landing-page copy can adapt to browser language while keeping explicit user override.
- Fast evaluation before full load. The app previews headers, load path, risk level, and estimated display ratio before import.
- Practical inspection workflow. Switch between 3D and 2D, inspect slices, review classifications, and check statistics in one tool.
- Public demo included. GitHub Pages ships `index.html` as the landing page and the bundled sample LAS for quick validation.

## Try It In 60 Seconds

1. Open the GitHub Pages landing page or launch the app directly.
2. In the app, choose `サンプルデータを使用` and select the bundled Pages sample, or load your own `.las` / `.laz`.
3. Review the pre-flight panel for load path, risk level, and estimated display ratio.
4. Inspect the cloud in 3D / 2D, try slice mode, and review statistics and classification output.

## Key Capabilities

- LAS/LAZ loading
- Chunked LAS loading for large-file pressure smoothing
- LAZ chunked reads with WASM heap writes to reduce duplicate memory use
- Header-first preview and accurate display-ratio preview before import
- Load-path visibility and estimated peak RAM risk display before import
- Load quality selection (`LOW` / `MEDIUM` / `HIGH` / `MAX`)
- 3D and 2D view switching
- Elevation and classification color modes
- Slice view and 2D cross-section inspection
- Automatic classification assistance and classification quality review
- Statistics panel for point counts, class breakdowns, and processing time

## Browser / Runtime Requirements

- Recommended browsers: Chrome / Edge / Firefox latest versions
- Required APIs: WebGL, File API, ArrayBuffer
- Accepted inputs: `.las`, `.laz`
- Implementation ceiling: LAS files above 3GB and LAZ files above 2GB are rejected

## Constraints

- `three.js` and `laz-perf` are loaded from CDNs, so normal operation requires network access.
- LAS files in the `2GB to 3GB` range are experimental. Start from `LOW` quality and verify memory use and responsiveness.
- LAZ has a narrower safety margin because the decoder consumes extra memory. Files above `2GB` are rejected.
- Local LAS uses header-first preview plus chunked point-data reads. Local LAZ uses chunked transfers into WASM. URL loading and some compatibility paths may still use full `ArrayBuffer` reads.
- Raising file-size acceptance does not change the actual render cap. Confirm `source points / rendered points / render ratio` in the quality screen and statistics panel.
- Automatic classification is a height-based assist feature, not a survey-grade classification guarantee.

## Repository Layout

- `index.html`: GitHub Pages landing page for the public demo
- `PointCloudWorkbench.html`: single-file application
- `assets/`: screenshot and visual asset directory for README / Pages presentation
- `demo/pointcloud-demo-sample.las`: bundled LAS sample for Pages demo
- `scripts/`: regression tests and README consistency checks
- `PointCloudWorkbench_ドキュメント索引.md`: Japanese document entry point
- `PointCloudWorkbench_運用手順書.md`: Japanese operations guide
- `PointCloudWorkbench_実装リファレンス.md`: Japanese implementation reference

## License

- Licensed under `MIT`. See `LICENSE`.

## Development

- Distribution stays single-file. `PointCloudWorkbench.html` is the runtime artifact and there is no build pipeline.
- JavaScript/TypeScript execution and tests assume `bun`.
- `scripts/` is for development-time regression tests and README checks, not for running the app.
- Update the related operation and implementation documents when behavior changes.

## Testing

- `bun test scripts/pointcloud-workbench.test.js scripts/documentation-consistency.test.js scripts/gitignore.test.js scripts/repository-metadata.test.js scripts/public-repo-readiness.test.js scripts/landing-page-i18n.test.js`
- `bun scripts/check-readme.js`

## Repository Scope

- The main public deliverable is `PointCloudWorkbench.html` plus the related documentation.
- GitHub Pages uses `index.html` as the landing page and serves `PointCloudWorkbench.html` directly as the actual app.
- `scripts/` is published as verification assets for development and maintenance.
- `test-results/` and local helper-tool outputs are not part of the public deliverable.

## CDN / Network Notes

- Runtime depends on `three.js` and `laz-perf` served from CDNs.
- Normal usage requires network access. If the CDN is unreachable, the app may fail to initialize.
- The GitHub Pages demo has the same CDN dependency.
