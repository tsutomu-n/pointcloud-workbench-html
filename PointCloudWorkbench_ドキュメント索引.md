# PointCloudWorkbench ドキュメント索引

`PointCloudWorkbench.html` 向けの資料を用途別に分割しました。

更新日時: 2026-03-02 11:44:07 JST
検証対象: `PointCloudWorkbench.html`（13,042行、上記時刻時点）

## この索引の前提
- 行番号リンクは上記更新日時時点で検証済みです。`PointCloudWorkbench.html` の編集後は行番号がずれる可能性があります。
- 言語セレクタは `document.documentElement.lang` と `localStorage.viewerLanguage` を更新します。UI文言のリアルタイム翻訳は実装されていません。
- ファイルサイズ判定は `2GB超` を拒否します。`2GBちょうど` は `critical` 扱いで継続可能です。

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
| `startDataLoading` | [PointCloudWorkbench.html#L6938](PointCloudWorkbench.html#L6938) | 読み込み処理開始 |
| `loadLASFileActual` | [PointCloudWorkbench.html#L7315](PointCloudWorkbench.html#L7315) | LAS/LAZ 実データ読み込み |
| `createPointCloudFromData` | [PointCloudWorkbench.html#L8385](PointCloudWorkbench.html#L8385) | 点群ジオメトリ生成 |
| `setColorMode` | [PointCloudWorkbench.html#L9351](PointCloudWorkbench.html#L9351) | 表示モード切替 |
| `toggleSlicing` | [PointCloudWorkbench.html#L10083](PointCloudWorkbench.html#L10083) | スライス表示切替 |
| `autoClassify` | [PointCloudWorkbench.html#L11535](PointCloudWorkbench.html#L11535) | 自動分類開始 |
| `toggleStatsPanel` | [PointCloudWorkbench.html#L12603](PointCloudWorkbench.html#L12603) | 統計パネル表示切替 |
| `performFinalCleanup` | [PointCloudWorkbench.html#L12957](PointCloudWorkbench.html#L12957) | 緊急クリーンアップ |
