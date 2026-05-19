# PointCloudWorkbench ドキュメント索引

`PointCloudWorkbench.html` 向けの資料を用途別に分割しました。

更新日時: 2026-05-19 00:00:00 JST
検証対象: `PointCloudWorkbench.html`

## この索引の前提
- 行番号リンクは上記更新日時時点で検証済みです。`PointCloudWorkbench.html` の編集後は行番号がずれる可能性があります。
- 言語セレクタは `document.documentElement.lang` と `localStorage.viewerLanguage` を更新します。UI文言のリアルタイム翻訳は実装されていません。
- ファイルサイズ判定は LAS は `3GB超`、LAZ は `2GB超` を拒否します。
- LAS の `3GBちょうど` と LAZ の `2GBちょうど` は `critical` 扱いで継続可能です。
- LAS の `2GB超〜3GB以下` は実験運用帯です。`LOW` からの開始と負荷監視を前提にしてください。
- ローカル `LAS` は chunked 読み込み、ローカル `LAZ` は chunked で WASM ヒープへ直書きする構成です。
- 距離計測は表示中のサンプリング点への計測で、距離は `m相当` として表示し、元データの座標単位に依存します。推定ピークRAMには計測用の元座標保持分も含めます。
- CRS 診断は LAS/LAZ 内の header / VLR / EVLR metadata をローカルで読む表示機能です。座標変換、EPSG DB 参照、外部 API、サーバー処理、LAS/LAZ アップロードは行いません。

## 運用者向け
- `PointCloudWorkbench_運用手順書.md`
- 画面操作、日常運用、障害時の一次対応、運用チェックリスト

## 開発者向け
- `PointCloudWorkbench_実装リファレンス.md`
- 実装構造、主要関数、状態モデル、拡張ポイント、改修時の注意点

## 計画・仕様
- `docs/crs-diagnostics-implementation-plan.ja.md`
- `docs/crs-diagnostics-final-spec.ja.md`
- `docs/crs-diagnostics-oss-research.ja.md`
- CRS 診断の推奨実装計画、最終形仕様、OSS 採用調査

## 運用ルール
- 実装変更時は、該当するガイドを同時更新してください。
- 操作仕様を変更した場合は運用ガイド、内部処理を変更した場合は実装リファレンスを更新対象にしてください。

## 主要関数クイックリンク（PointCloudWorkbench.html）

| 関数 | 行番号リンク | 用途 |
|---|---|---|
| `startDataLoading` | [PointCloudWorkbench.html#L9398](PointCloudWorkbench.html#L9398) | 読み込み処理開始 |
| `loadLASFileActual` | [PointCloudWorkbench.html#L9918](PointCloudWorkbench.html#L9918) | LAS/LAZ 実データ読み込み |
| `readLASProjectionRecordsFromFile` | [PointCloudWorkbench.html#L11056](PointCloudWorkbench.html#L11056) | CRS VLR/EVLR 抽出 |
| `buildCoordinateReferenceDiagnostics` | [PointCloudWorkbench.html#L11258](PointCloudWorkbench.html#L11258) | CRS 診断 status 作成 |
| `parseLASHeader` | [PointCloudWorkbench.html#L11392](PointCloudWorkbench.html#L11392) | LAS header / CRS 境界情報解析 |
| `createPointCloudFromData` | [PointCloudWorkbench.html#L12009](PointCloudWorkbench.html#L12009) | 点群ジオメトリ生成 |
| `setColorMode` | [PointCloudWorkbench.html#L13017](PointCloudWorkbench.html#L13017) | 表示モード切替 |
| `toggleSlicing` | [PointCloudWorkbench.html#L13681](PointCloudWorkbench.html#L13681) | スライス表示切替 |
| `autoClassify` | [PointCloudWorkbench.html#L15128](PointCloudWorkbench.html#L15128) | 自動分類開始 |
| `toggleStatsPanel` | [PointCloudWorkbench.html#L16203](PointCloudWorkbench.html#L16203) | 統計パネル表示切替 |
| `updateCrsDiagnosticsDisplay` | [PointCloudWorkbench.html#L16233](PointCloudWorkbench.html#L16233) | CRS 診断 UI 反映 |
| `performFinalCleanup` | [PointCloudWorkbench.html#L16584](PointCloudWorkbench.html#L16584) | 緊急クリーンアップ |
