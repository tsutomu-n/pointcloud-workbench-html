# PointCloudWorkbench ドキュメント索引

`PointCloudWorkbench.html` 向けの資料を用途別に分割しました。

更新日時: 2026-03-15 21:55:39 JST
検証対象: `PointCloudWorkbench.html`（13,617行、上記時刻時点）

## この索引の前提
- 行番号リンクは上記更新日時時点で検証済みです。`PointCloudWorkbench.html` の編集後は行番号がずれる可能性があります。
- 言語セレクタは `document.documentElement.lang` と `localStorage.viewerLanguage` を更新します。UI文言のリアルタイム翻訳は実装されていません。
- ファイルサイズ判定は LAS は `3GB超`、LAZ は `2GB超` を拒否します。
- LAS の `3GBちょうど` と LAZ の `2GBちょうど` は `critical` 扱いで継続可能です。
- LAS の `2GB超〜3GB以下` は実験運用帯です。`LOW` からの開始と負荷監視を前提にしてください。
- ローカル `LAS` は chunked 読み込み、ローカル `LAZ` は chunked で WASM ヒープへ直書きする構成です。

## 運用者向け
- `PointCloudWorkbench_運用手順書.md`
- 画面操作、日常運用、障害時の一次対応、運用チェックリスト

## 開発者向け
- `PointCloudWorkbench_実装リファレンス.md`
- 実装構造、主要関数、状態モデル、拡張ポイント、改修時の注意点

## 運用ルール
- 実装変更時は、該当するガイドを同時更新してください。
- 操作仕様を変更した場合は運用ガイド、内部処理を変更した場合は実装リファレンスを更新対象にしてください。

## 主要関数クイックリンク（PointCloudWorkbench.html）

| 関数 | 行番号リンク | 用途 |
|---|---|---|
| `startDataLoading` | [PointCloudWorkbench.html#L7157](PointCloudWorkbench.html#L7157) | 読み込み処理開始 |
| `loadLASFileActual` | [PointCloudWorkbench.html#L7560](PointCloudWorkbench.html#L7560) | LAS/LAZ 実データ読み込み |
| `createPointCloudFromData` | [PointCloudWorkbench.html#L8933](PointCloudWorkbench.html#L8933) | 点群ジオメトリ生成 |
| `setColorMode` | [PointCloudWorkbench.html#L9907](PointCloudWorkbench.html#L9907) | 表示モード切替 |
| `toggleSlicing` | [PointCloudWorkbench.html#L10639](PointCloudWorkbench.html#L10639) | スライス表示切替 |
| `autoClassify` | [PointCloudWorkbench.html#L12091](PointCloudWorkbench.html#L12091) | 自動分類開始 |
| `toggleStatsPanel` | [PointCloudWorkbench.html#L13159](PointCloudWorkbench.html#L13159) | 統計パネル表示切替 |
| `performFinalCleanup` | [PointCloudWorkbench.html#L13513](PointCloudWorkbench.html#L13513) | 緊急クリーンアップ |
