# Contributing

PointCloudWorkbenchへの貢献ありがとうございます。

このプロジェクトは、サーバー負荷を増やさず、ユーザーPC側のブラウザーでLAS/LAZ点群を処理する設計を重視します。

## 開発前に読むもの

1. `docs/quickstart.ja.md`
2. `docs/for-junior-se.ja.md`
3. `docs/architecture-client-max.ja.md`
4. `docs/cloudflare-pages-static-only.ja.md`

## 基本ルール

やってよいこと:

- LAS/LAZ読込改善
- Preflight改善
- Worker処理改善
- WebGPU/WebGL2描画改善
- UI改善
- ドキュメント改善
- テスト追加

やってはいけないこと:

- 点群ファイルをサーバーへ送信する
- Cloudflare Workerで点群処理する
- Pages Functionsで点群処理する
- 自動telemetryを追加する
- API依存を増やす
- Safari/Firefox対応を前提にした大改修をする
- 大容量ファイル上限を根拠なく緩和する

## PR前チェック

```bash
bun test scripts/pointcloud-workbench.test.js scripts/documentation-consistency.test.js scripts/gitignore.test.js scripts/repository-metadata.test.js scripts/public-repo-readiness.test.js scripts/landing-page-i18n.test.js
bun scripts/check-readme.js
bun scripts/check-server-zero.js
# 任意: actionlint .github/workflows/*.yml
```

## PRに書くこと

- 何を変更したか
- なぜ必要か
- 既存挙動への影響
- テスト結果
- サーバー/API負荷が増えないこと
- 点群ファイルを外部送信しないこと
