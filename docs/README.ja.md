# PointCloudWorkbench 日本語 README

- English README: [`../README.md`](../README.md)

ブラウザで動く、LAS/LAZ 対応の単一 HTML 点群ワークベンチです。3D/2D 表示、スライス、分類、統計確認に対応します。

## Live Demo

- GitHub Pages: `https://tsutomu-n.github.io/pointcloud-workbench-html/`
- 実アプリ: `https://tsutomu-n.github.io/pointcloud-workbench-html/PointCloudWorkbench.html`
- 同梱サンプル LAS: `https://tsutomu-n.github.io/pointcloud-workbench-html/demo/pointcloud-demo-sample.las`
- ランディングページはブラウザ言語を見て `ja` / `en` / `zh` を自動選択し、手動切替でも上書きできます。

## 画像配置

- README や Pages 紹介に使う画像は `../assets/` に置きます。
- 画像の具体的な構図、役割、見せたい情報は [`../assets/README.md`](../assets/README.md) にまとめています。
- 想定ファイル名は `landing-hero.png`, `preflight-panel.png`, `workspace-3d.png`, `workspace-2d-slice-stats.png` です。

## 主な機能

- LAS/LAZ ファイルの読込
- LAS の chunked 読み込みによる大容量ファイル負荷の平準化
- LAZ の chunked 読込 + WASM ヒープ直書きによるメモリ重複の抑制
- ファイル選択直後のヘッダー先読みと、品質画面での正確な表示率プレビュー
- 読込前の読込経路表示と、推定ピーク RAM ベースの危険度表示
- 読込前の品質選択（`LOW` / `MEDIUM` / `HIGH` / `MAX`）
- 3D 表示と 2D 表示の切替
- 標高・分類による色分け表示
- スライス表示と 2D 断面確認
- 自動分類と分類品質の確認
- 統計パネルによる点数、分類内訳、処理時間の確認

## 使い方

1. `PointCloudWorkbench.html` を Chrome / Edge / Firefox で開きます。
2. LAS/LAZ ファイルをドラッグ&ドロップするか、ファイル選択から読み込みます。
3. 品質画面で表示率、読込経路、危険度を確認してから読み込みを開始します。
4. 読み込み完了後、視点切替、色分け、スライス、自動分類、統計表示を必要に応じて使います。

補足:
- `PointCloudWorkbench.html` は単一 HTML で動作します。
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
- ローカル `LAS` はヘッダー先読込 + chunked 点データ読込、ローカル `LAZ` は chunked で WASM ヒープへ転送します。`URL` 読込や一部互換経路では従来どおり全量 `ArrayBuffer` を使う場合があります。
- 読込上限を拡張しても、実際の表示点数は品質設定の上限に従います。品質画面と統計パネルで `元点数 / 表示点数 / 表示率` を確認してください。
- 自動分類は高さベースの簡易補助機能であり、厳密な測量級分類を保証するものではありません。

## ファイル構成

- `index.html`: GitHub Pages のランディングページ
- `PointCloudWorkbench.html`: アプリ本体
- `assets/`: README / Pages 用の画像アセット置き場
- `demo/pointcloud-demo-sample.las`: Pages デモ用の同梱 LAS サンプル
- `scripts/`: 開発用の回帰テストと README 整合チェック
- `PointCloudWorkbench_ドキュメント索引.md`: 文書の入口
- `PointCloudWorkbench_運用手順書.md`: 利用者向けの運用ガイド
- `PointCloudWorkbench_実装リファレンス.md`: 開発者向けの実装ガイド

## 関連ドキュメント

- `PointCloudWorkbench_ドキュメント索引.md`
- `PointCloudWorkbench_運用手順書.md`
- `PointCloudWorkbench_実装リファレンス.md`

## Development

- 配布モデルは単一 HTML です。実行本体は `PointCloudWorkbench.html` で、ビルド工程はありません。
- JavaScript/TypeScript の実行とテストは `bun` を前提にしています。
- `scripts/` は開発用の回帰テストと README 整合チェックであり、アプリ本体の実行には不要です。

## Testing

- `bun test scripts/pointcloud-workbench.test.js scripts/documentation-consistency.test.js scripts/gitignore.test.js scripts/repository-metadata.test.js scripts/public-repo-readiness.test.js scripts/landing-page-i18n.test.js`
- `bun scripts/check-readme.js`
