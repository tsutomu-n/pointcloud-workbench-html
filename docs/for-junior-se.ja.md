# ジュニアSE向けガイド

## このプロジェクトは何か

PointCloudWorkbenchは、LAS/LAZ形式の点群ファイルをブラウザーで確認するためのワークベンチです。

通常のWebサービスと違い、点群ファイルをサーバーへアップロードしません。
重い処理はユーザーPC側で行います。

## まず理解するキーワード

### LAS / LAZ

点群データのファイル形式です。
LASは非圧縮、LAZは圧縮版です。

### Preflight

読み込む前の事前確認です。
ファイルサイズ、点数、メモリリスク、表示率などを確認します。

### 表示率

元データのうち、実際に画面へ表示している点の割合です。
例: 元点数 10,000,000点、表示点数 1,000,000点なら表示率10%です。

### Worker

ブラウザー内の別スレッドです。
重いLAS/LAZ解析をUIから分離して、画面が固まりにくくします。

### ReaderRegistry

`.las` / `.laz` などの拡張子に応じて、使う読み込み処理を選ぶ仕組みです。

### WebGPU / WebGL2

ブラウザーでGPU描画を行うための仕組みです。
WebGPUが使える場合は高速化できます。

### Client-Max / Server-Zero

サーバーに処理させず、ユーザーPCで処理する設計方針です。

## 開発時に最初に見るファイル

```txt
PointCloudWorkbench.html
docs/README.ja.md
PointCloudWorkbench_実装リファレンス.md
PointCloudWorkbench_運用手順書.md
scripts/
```

## よくある作業

### READMEの修正

OSS利用者が最初に見るため、説明は短く明確にします。

### テストの実行

```bash
bun test scripts/pointcloud-workbench.test.js scripts/documentation-consistency.test.js scripts/gitignore.test.js scripts/repository-metadata.test.js scripts/public-repo-readiness.test.js scripts/landing-page-i18n.test.js
bun scripts/check-readme.js
bun scripts/check-server-zero.js
```

### Issue対応

1. 再現手順を確認する。
2. ブラウザーを確認する。
3. LAS/LAZの種類を確認する。
4. ファイルサイズを確認する。
5. 既知の制約に該当するか確認する。

## 変更してはいけないこと

- 点群ファイルを勝手にサーバーへ送信しない。
- Cloudflare Workerで点群処理しない。
- Pages Functionsで点群処理しない。
- 自動ログ送信を勝手に入れない。
- Safari/Firefox対応を前提にしない。
- 大容量ファイルの上限を根拠なく緩和しない。
