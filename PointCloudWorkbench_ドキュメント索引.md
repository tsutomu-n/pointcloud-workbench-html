# PointCloudWorkbench ドキュメント索引

`PointCloudWorkbench.html` 向けの資料を用途別に分割しました。

更新日時: 2026-06-03_09:06 JST
検証対象: `PointCloudWorkbench.html`

## この索引の前提
- 関数位置は `PointCloudWorkbench.html` 内の関数名検索を正とします。固定行番号リンクは編集でずれやすいため、主要表では使いません。
- 言語セレクタは `document.documentElement.lang` と `localStorage.viewerLanguage` を更新します。UI文言のリアルタイム翻訳は実装されていません。
- ファイルサイズ判定は LAS は `3GB超`、LAZ は `2GB超` を拒否します。
- LAS の `3GBちょうど` と LAZ の `2GBちょうど` は `critical` 扱いで継続可能です。
- LAS の `2GB超〜3GB以下` は実験運用帯です。`LOW` からの開始と負荷監視を前提にしてください。
- ローカル `LAS` は chunked 読み込み、ローカル `LAZ` は chunked で WASM ヒープへ直書きする構成です。
- Measurement v2 は表示中のサンプリング点への計測です。2点距離、折れ線累計、XY投影面積、元LAS基準の `dX / dY / dZ` を扱い、距離や面積は元データの座標単位に依存します。推定ピークRAMには計測用の元座標保持分も含めます。
- Density Heatmap Overlay は表示点ベースの参考表示です。元 LAS/LAZ 全点の厳密密度、測量成果、欠測証明として扱いません。
- CRS 診断は LAS/LAZ 内の header / VLR / EVLR metadata をローカルで読む表示機能です。JGD2011 平面直角座標系の bounds 中心変換を除き、全点座標変換、EPSG DB 参照、外部 API、サーバー処理、LAS/LAZ アップロードは行いません。
- 取得品質、地表候補アシスト、作業メモコピーはローカル処理です。自動送信、サーバー保存、点群 payload のコピーは行いません。

## 運用者向け
- `PointCloudWorkbench_運用手順書.md`
- 画面操作、日常運用、障害時の一次対応、運用チェックリスト

## 開発者向け
- `PointCloudWorkbench_実装リファレンス.md`
- 実装構造、主要関数、状態モデル、拡張ポイント、改修時の注意点
- `docs/current-state-and-implemented-features.ja.md`
- 現在の repo 状態、実装済み機能、制約、公開 API、検証入口の一覧

## 計画・仕様
- `docs/crs-diagnostics-final-spec.ja.md`
- CRS 診断の現行仕様

## 過去計画・過去レビュー
- `docs/archive/`
- `.plan/archive/`（ローカル計画メモ。git 管理外）
- archive 内の文書は現行仕様ではなく、過去の作業指示、計画、レビュー、調査メモとして扱ってください。

## 運用ルール
- 実装変更時は、該当するガイドを同時更新してください。
- 操作仕様を変更した場合は運用ガイド、内部処理を変更した場合は実装リファレンスを更新対象にしてください。

## 再開時の最小検証順
1. `bun test scripts/pointcloud-workbench.test.js`
2. `bun scripts/check-readme.js`
3. `bunx --package playwright node scripts/e2e/run-diagnostics-smoke.mjs --las samples/test.las --laz samples/test.laz`
4. 必要なら `workflow_dispatch` の `Diagnostics Smoke` を手動実行してスクリーンショット成果物を確認

## 主要関数クイックリファレンス（PointCloudWorkbench.html）

| 関数 | 探し方 | 用途 |
|---|---|---|
| `startDataLoading` | 関数名検索 | 読み込み処理開始 |
| `loadLASFileActual` | 関数名検索 | LAS/LAZ 実データ読み込み |
| `buildAcquisitionQualityReport` | 関数名検索 | 取得品質の参考診断 |
| `buildWorkAssistSnapshot` | 関数名検索 | 作業メモ JSON 作成 |
| `copyWorkAssistSnapshot` | 関数名検索 | 作業メモコピー |
| `buildGroundCandidateGrid` | 関数名検索 | 地表候補アシスト |
| `buildPointCloudDiagnostics` | 関数名検索 | 点群診断レポート作成 |
| `buildDensityGrid` | 関数名検索 | 表示点ベース density grid 作成 |
| `createDensityOverlayMesh` | 関数名検索 | 密度ヒートマップ overlay mesh 作成 |
| `readLASProjectionRecordsFromFile` | 関数名検索 | CRS VLR/EVLR 抽出 |
| `buildCoordinateReferenceDiagnostics` | 関数名検索 | CRS 診断 status 作成 |
| `parseLASHeader` | 関数名検索 | LAS header / CRS 境界情報解析 |
| `createPointCloudFromData` | 関数名検索 | 点群ジオメトリ生成 |
| `setColorMode` | 関数名検索 | 表示モード切替 |
| `toggleSlicing` | 関数名検索 | スライス表示切替 |
| `autoClassify` | 関数名検索 | 自動分類開始 |
| `toggleStatsPanel` | 関数名検索 | 統計パネル表示切替 |
| `updateCrsDiagnosticsDisplay` | 関数名検索 | CRS 診断 UI 反映 |
| `performFinalCleanup` | 関数名検索 | 緊急クリーンアップ |
