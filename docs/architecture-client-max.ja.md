# Client-Max / Server-Zero Architecture

## 目的

Cloudflare無料制限を超えないため、処理を最大限ユーザー側に寄せます。

## Server

Cloudflare側の責務:

- 静的ファイル配信
- キャッシュ
- ヘッダー付与
- latest redirect
- 404ページ

Cloudflare側の禁止事項:

- 点群処理
- 点群アップロード
- LAS/LAZファイルのアップロード受付
- LAZ展開
- 統計計算
- 画像生成
- 操作ログ収集
- 診断情報の自動収集
- ユーザーDB
- セッション管理

選択したLAS/LAZファイルはサーバーへアップロードしない設計です。

## Client

ユーザーPC側の責務:

- ファイル選択
- LAS/LAZ読込
- ReaderRegistryによる形式別Reader選択
- PointCloudDataによる点数、bounds、scale/offset基準の整理
- Preflight
- Worker解析
- WebAssembly LAZ展開
- WebGPU/WebGL2描画
- 統計
- 分類補助
- スライス
- 測定
- スクリーンショット
- 手動診断情報コピー
- OPFS/IndexedDBキャッシュ

## なぜこの設計か

点群処理は重く、大容量です。
サーバーにアップロードして処理すると、サーバー費用、情報管理リスク、待ち時間が増えます。

このプロジェクトでは、Webアプリでありながら、実態は「ブラウザーで配るローカルアプリ」に近づけます。
