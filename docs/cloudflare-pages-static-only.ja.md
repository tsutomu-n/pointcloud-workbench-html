# Cloudflare Pages の静的配信構成案

timestamp="2026-11-20(金)_22:54 JST"

> 公開デモの現行配信は [GitHub Pages](../.github/workflows/deploy-pages.yml) です。この文書は Cloudflare Pages で配信する場合の構成案です。

## 目的

Cloudflare無料制限を超えないことを最優先し、サーバー側は静的ファイル配信だけにします。

## 将来の推奨構成

現状の実行本体は `PointCloudWorkbench.html` の単一HTMLです。
以下は、今後WorkerやRendererを分割する場合のstatic-only構成案です。

```txt
Cloudflare Pages
├─ PointCloudWorkbench.html
├─ assets/
│  └─ v1.0.0/
│     ├─ manifest.json
│     ├─ app-core.js
│     ├─ las-worker.js
│     ├─ laz-worker.js
│     ├─ laz-perf.wasm
│     ├─ webgpu-renderer.js
│     └─ webgl2-renderer.js
├─ _headers
└─ _redirects
```

## 使わないもの

- Pages Functions
- Workers fetch handler
- KV
- D1
- Durable Objects
- R2 初期必須化
- telemetry API
- upload API

## `_headers` の方針

- versioned assetsは長期キャッシュ
- latest manifestは短期キャッシュ
- Hosted版だけCOOP/COEPを付ける
- Portable Online用assetはCORSを許可する

## 注意

Cloudflare Pagesには1ファイル25MiBの制限があります。
WASMや巨大bundleは分割してください。
