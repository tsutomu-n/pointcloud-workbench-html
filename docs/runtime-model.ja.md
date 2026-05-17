# 実行モデル

## 基本方針

PointCloudWorkbenchは、サーバー負荷を最小化し、重い処理をユーザーPC側で行う設計です。
診断情報も通常経路では送信せず、ユーザーが明示的にコピーしたJSONだけをIssue等へ貼り付ける運用です。
このJSONにはLAS/LAZファイル本体とファイル名を含めません。

## Runtime Modes

アプリのファイル選択画面には、現在のRuntime Mode、ブラウザー種別、Renderer候補、Worker可否、Isolation状態を表示します。

### 1. Portable Online Mode

ユーザーが `PointCloudWorkbench.html` をダウンロードして、ChromeまたはEdgeで開くモードです。

特徴:

- ネットワーク接続が必要
- JS/WASM/Workerを取得する
- 点群ファイルはアップロードしない
- SharedArrayBufferは前提にしない
- Transferable ArrayBufferを使う
- WebGPUまたはWebGL2で描画する

### 2. Hosted High Performance Mode

Cloudflare Pages上のURLで開くモードです。

特徴:

- HTTPS
- COOP/COEPヘッダーを設定可能
- crossOriginIsolatedを狙える
- SharedArrayBufferを使える可能性がある
- Wasm threadsを使える可能性がある
- 最高速候補

### 3. Fallback Mode

WebGPUやWorkerが使えない場合の劣化モードです。

特徴:

- WebGL2 fallback
- Single Worker fallback
- Main thread低速処理 fallback
- 機能制限をUIに表示する

## サーバーにやらせないこと

- LAS/LAZ解析
- LAZ展開
- 統計計算
- 点群保存
- スクリーンショット生成
- 自動ログ収集
- ユーザー管理
