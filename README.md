# PointCloudWorkbench

ブラウザで動く、LAS/LAZ対応の単一HTML点群ワークベンチです。3D/2D表示、スライス、分類、統計確認に対応します。

## 主な機能

- LAS/LAZ ファイルの読込
- 読込前の品質選択（LOW / MEDIUM / HIGH / MAX）
- 3D表示と 2D表示の切替
- 標高・分類による色分け表示
- スライス表示と 2D 断面確認
- 自動分類と分類品質の確認
- 統計パネルによる点数、分類内訳、処理時間の確認
- 大容量ファイル向けのサイズ警告と性能配慮

## 使い方

1. `PointCloudWorkbench.html` を Chrome / Edge / Firefox で開きます。
2. LAS/LAZ ファイルをドラッグ&ドロップするか、ファイル選択から読み込みます。
3. 品質を選び、読み込みを開始します。
4. 読み込み完了後、視点切替、色分け、スライス、自動分類、統計表示を必要に応じて使います。

補足:
- `PointCloudWorkbench.html` は単一HTMLで動作します。
- `three.js` と `laz-perf` は CDN から読み込むため、通常はネットワーク接続が必要です。

## 動作条件

- 推奨ブラウザ: Chrome / Edge / Firefox の最新版
- 必須機能: WebGL、File API、ArrayBuffer
- 対応入力: `.las`, `.laz`
- 実装上のファイルサイズ上限: LAS は 3GB超、LAZ は 2GB超で読み込み不可

## 制約

- `three.js` と `laz-perf` は CDN から読み込むため、通常はネットワーク接続が必要です。
- LAS の `2GB超〜3GB以下` は実験運用帯です。`LOW` 品質から開始し、メモリと応答性を確認してください。
- LAZ は内部で追加メモリを消費するため、LAS より安全域が狭く、`2GB超` は拒否されます。
- 自動分類は高さベースの簡易補助機能であり、厳密な測量級分類を保証するものではありません。

## ファイル構成

- `PointCloudWorkbench.html`: アプリ本体
- `PointCloudWorkbench_ドキュメント索引.md`: 文書の入口
- `PointCloudWorkbench_運用手順書.md`: 利用者向けの運用ガイド
- `PointCloudWorkbench_実装リファレンス.md`: 開発者向けの実装ガイド

## 関連ドキュメント

- `PointCloudWorkbench_ドキュメント索引.md`
- `PointCloudWorkbench_運用手順書.md`
- `PointCloudWorkbench_実装リファレンス.md`

## 補足

- 言語セレクタは `lang` 属性と保存値を切り替えますが、UI文言の自動翻訳は行いません。
- 実装変更時は、関連する運用文書と実装文書もあわせて更新してください。
