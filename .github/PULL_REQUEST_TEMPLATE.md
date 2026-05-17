## 何を変更したか / What Changed

-

## なぜ必要か / Why

-

## 既存挙動への影響 / Impact On Existing Behavior

-

## テスト結果 / Test Results

-

## サーバー負荷への影響 / Server Load

- This change does not add Workers, Pages Functions, APIs, telemetry, DB writes, or server-side point cloud processing.
- APIを追加していない
- Cloudflare Workerで点群処理していない
- Pages Functionsで点群処理していない
- telemetryを追加していない

## 点群ファイルの扱い / Point Cloud File Privacy

- Selected LAS/LAZ files are not uploaded or sent to the application server.
- 点群ファイルをサーバーへ送信していない
