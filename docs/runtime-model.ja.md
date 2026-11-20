# 実行モデル

timestamp="2026-11-20(金)_22:54 JST"

## 基本方針

PointCloudWorkbenchは、重い処理を利用者の端末で行い、点群ファイルをサーバーへアップロードしません。
診断情報も通常経路では送信せず、ユーザーが明示的にコピーしたJSONだけをIssue等へ貼り付ける運用です。
このJSONにはLAS/LAZファイル本体とファイル名を含めません。
作業メモコピーも同じく手動コピーだけで、表示状態、断面、計測、異常候補、取得品質、地表候補の要約をローカルで作ります。
ローカルファイル名、点群payload、元LAS座標配列は含めません。

## Runtime Modes

アプリのファイル選択画面には、現在のRuntime Mode、ブラウザー種別、Renderer候補、Worker可否、Isolation状態を表示します。
これらは実行環境の能力表示であり、現行実装が Worker parser や WebGPU renderer を使っているという意味ではありません。

| 表示されるモード | 判定の概要 |
| --- | --- |
| `hosted-normal` | 通常のホスト配信。公開デモの配信手順は [GitHub Pages ワークフロー](../.github/workflows/deploy-pages.yml) を参照。 |
| `hosted-high-performance` | ホスト配信でクロスオリジン分離と WebGPU 能力を検出。 |
| `portable-online-webgpu` / `portable-online-webgl2` | ローカルHTMLを開いた場合のGPU能力に応じた表示。CDN依存の取得にはネット接続が必要。 |
| `unsupported` | 対応ブラウザーの条件を満たさない、または WebGPU と WebGL2 の両方が利用できない。 |

現行の描画には Three.js の WebGLRenderer を使います。モード名の WebGPU や Worker 可否の表示はブラウザー能力の情報です。将来の配信構成は [Cloudflare Pages の静的配信構成案](./cloudflare-pages-static-only.ja.md) を参照してください。

## サーバーにやらせないこと

- LAS/LAZ解析
- LAZ展開
- 統計計算
- CRS診断
- 取得品質診断
- 地表候補アシスト
- 作業メモ生成
- 点群保存
- スクリーンショット生成
- 自動ログ収集
- ユーザー管理
